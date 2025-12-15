import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, ChevronLeft, ChevronRight, Cloud, CloudOff, RefreshCw, Menu, X, AlertTriangle, Lock, Maximize, RefreshCcw, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { showConfirm, showError } from '../utils/alert';

interface Question {
    id: number;
    type: string;
    content: string;
    options: { id: string; text: string }[];
    points: number;
}

interface ExamData {
    id: number;
    title: string;
    duration: number;
    end_time: string;
}

const StudentExamPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState<ExamData | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false); // Ref untuk akses di dalam event listener
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // --- MODAL STATES ---

    const [isTimeUpModalOpen, setIsTimeUpModalOpen] = useState(false);

    // --- ANTI CHEATING STATES ---
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false); // Temporary lock (fullscreen, blur)
    const [isPermanentLocked, setIsPermanentLocked] = useState(false); // Server-side lock
    const [lockReason, setLockReason] = useState<string>('');
    const MAX_VIOLATIONS = 5;

    // Fetch Exam Data
    const fetchExam = useCallback(async () => {
        if (!user?.id) return;

        try {

            const response = await api.get(`/exams/${id}/take?studentId=${user.id}`);
            setExam(response.data.exam);
            setQuestions(response.data.questions);

            // Load saved session if exists
            if (response.data.saved_session) {
                const { answers: savedAnswers, current_question_index, is_locked, violation_count } = response.data.saved_session;

                if (savedAnswers) setAnswers(savedAnswers);
                if (typeof current_question_index === 'number') setCurrentQuestionIndex(current_question_index);

                // Restore violation state
                if (violation_count) setViolationCount(violation_count);

                // Handle Locked State
                if (is_locked) {
                    setIsPermanentLocked(true);
                    setLockReason('Ujian dikunci oleh pengawas karena pelanggaran.');
                } else {
                    // Jika sebelumnya terkunci tapi sekarang tidak, buka kunci
                    setIsPermanentLocked(false);
                }
            }

            if (typeof response.data.remaining_seconds === 'number') {
                setTimeLeft(response.data.remaining_seconds);
            } else {
                setTimeLeft(0);
            }

        } catch (error: any) {
            console.error('Gagal memuat ujian', error);
            if (error.response?.data?.isLocked) {
                setIsPermanentLocked(true);
                setLockReason(error.response.data.message);
                setViolationCount(error.response.data.violationCount || MAX_VIOLATIONS);
            } else {
                await showError(
                    'Gagal Memuat Ujian',
                    'Terjadi kesalahan saat memuat data ujian. Silakan coba lagi.'
                );
                navigate('/student-dashboard');
            }
        } finally {
            setLoading(false);
        }
    }, [id, navigate, user?.id]);

    useEffect(() => {
        fetchExam();
    }, [fetchExam]);

    // Timer Logic
    useEffect(() => {
        // Jangan jalankan timer jika loading, terkunci, atau modal waktu habis sudah terbuka
        if (loading || isPermanentLocked || isTimeUpModalOpen) return;

        // Jika waktu sudah habis (0 atau kurang), langsung buka modal
        if (timeLeft <= 0) {
            setIsTimeUpModalOpen(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsTimeUpModalOpen(true); // Trigger Time Up Modal
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, loading, isPermanentLocked, isTimeUpModalOpen]);

    // Auto Save every 30 seconds
    useEffect(() => {
        if (isPermanentLocked || isTimeUpModalOpen) return;
        const autoSave = setInterval(() => {
            if (Object.keys(answers).length > 0) {
                handleSaveProgress();
            }
        }, 30000);
        return () => clearInterval(autoSave);
    }, [answers, isPermanentLocked, isTimeUpModalOpen]);

    // --- ANTI CHEATING LOGIC ---

    const reportViolationToServer = async (reason: string, count: number, lock: boolean) => {
        try {
            await api.post(`/exams/${id}/violation`, {
                studentId: user?.id,
                reason,
                count,
                lock
            });
        } catch (error) {
            console.error('Gagal melaporkan pelanggaran', error);
        }
    };

    const handleViolation = useCallback((reason: string) => {
        if (isPermanentLocked || isSubmittingRef.current || isTimeUpModalOpen) return; // Bypass jika sedang submit atau waktu habis

        setViolationCount(prev => {
            const newCount = prev + 1;
            console.warn(`[VIOLATION] ${reason}. Count: ${newCount}`);

            const shouldLock = newCount >= MAX_VIOLATIONS;

            // Kirim ke server
            reportViolationToServer(reason, newCount, shouldLock);

            if (shouldLock) {
                setIsPermanentLocked(true);
                setLockReason('Batas pelanggaran tercapai. Ujian dikunci.');
            } else {
                // Hanya lock sementara (overlay)
                setLockReason(reason);
                setIsLocked(true);
            }

            return newCount;
        });
    }, [id, user?.id, isPermanentLocked, isTimeUpModalOpen]);

    const enterFullscreen = async () => {
        try {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            }
            setIsFullscreen(true);
            setIsLocked(false);
        } catch (err) {
            console.error('Error attempting to enable fullscreen:', err);
            await showConfirm(
                'Fullscreen Diblokir',
                'Browser Anda memblokir mode fullscreen. Mohon izinkan fullscreen untuk melanjutkan ujian.',
                'Coba Lagi',
                'Batal',
                'warning',
                'warning'
            );
        }
    };

    const checkUnlockStatus = async () => {
        setLoading(true);
        await fetchExam(); // Re-fetch status from server
        setLoading(false);
    };

    useEffect(() => {
        if (loading || isPermanentLocked) return;

        // 1. Fullscreen Change Listener
        const handleFullscreenChange = () => {
            if (isSubmittingRef.current || isTimeUpModalOpen) return; // Bypass jika sedang submit

            if (!document.fullscreenElement) {
                setIsFullscreen(false);
                handleViolation('Keluar dari mode Fullscreen');
            } else {
                setIsFullscreen(true);
                setIsLocked(false);
            }
        };

        // 2. Visibility Change (Tab Switch)
        const handleVisibilityChange = () => {
            if (isSubmittingRef.current || isTimeUpModalOpen) return; // Bypass jika sedang submit

            if (document.hidden) {
                handleViolation('Meninggalkan halaman ujian (Tab Switch)');
            }
        };

        // 3. Window Blur (Alt+Tab or Split Screen Click)
        const handleWindowBlur = () => {
            if (isSubmittingRef.current || isTimeUpModalOpen) return; // Bypass jika sedang submit

            if (isFullscreen) {
                handleViolation('Fokus jendela hilang (Membuka aplikasi lain)');
            }
        };

        // 4. Prevent Context Menu (Right Click)
        const handleContextMenu = (e: Event) => {
            e.preventDefault();
            return false;
        };

        // 5. Prevent Copy/Cut/Paste
        const handleCopyPaste = (e: ClipboardEvent) => {
            e.preventDefault();
            toast.warning('Fitur Copy/Paste dinonaktifkan selama ujian!', {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: false,
            });
        };

        // Attach Listeners
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopyPaste as any);
        document.addEventListener('cut', handleCopyPaste as any);
        document.addEventListener('paste', handleCopyPaste as any);

        // Initial Check
        if (!document.fullscreenElement) {
            setIsLocked(true);
            setLockReason('Mode Fullscreen Diperlukan');
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopyPaste as any);
            document.removeEventListener('cut', handleCopyPaste as any);
            document.removeEventListener('paste', handleCopyPaste as any);
        };
    }, [loading, isFullscreen, handleViolation, isPermanentLocked, isTimeUpModalOpen]);


    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSaveProgress = async () => {
        setSaveStatus('saving');
        try {
            await api.post(`/exams/${id}/submit`, {
                studentId: user?.id,
                answers,
                currentQuestionIndex,
                finished: false
            });
            setSaveStatus('saved');
        } catch (error) {
            console.error('Gagal menyimpan progress', error);
            setSaveStatus('error');
        }
    };

    // Fungsi Trigger Modal
    const handleFinishClick = async () => {
        const answeredCount = Object.keys(answers).length;
        const totalQuestions = questions.length;
        const unansweredCount = totalQuestions - answeredCount;

        if (unansweredCount > 0) {
            toast.error(`Masih ada ${unansweredCount} soal yang belum dijawab. Harap selesaikan semua soal sebelum mengumpulkan.`, {
                position: "top-center",
                autoClose: 4000
            });
            return;
        }

        const result = await showConfirm(
            'Selesaikan Ujian?',
            "Pastikan Anda sudah memeriksa semua jawaban. Jawaban tidak dapat diubah setelah dikumpulkan.",
            'Ya, Selesai',
            'Batal',
            'question',
            'success'
        );

        if (result.isConfirmed) {
            confirmFinish();
        }
    };

    // Fungsi Submit Sebenarnya
    const confirmFinish = async () => {
        setIsSubmitting(true);
        isSubmittingRef.current = true; // Set ref agar listener tahu kita sedang submit

        try {
            // Exit fullscreen before navigating
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(err => console.error(err));
            }

            await api.post(`/exams/${id}/submit`, {
                studentId: user?.id,
                answers,
                currentQuestionIndex,
                finished: true
            });

            navigate('/student-dashboard');
        } catch (error) {
            console.error('Gagal mengumpulkan ujian', error);
            await showError(
                'Gagal Mengumpulkan',
                (error as any).response?.data?.message || 'Gagal mengumpulkan ujian. Periksa koneksi internet Anda.'
            );
            setIsSubmitting(false);
            isSubmittingRef.current = false; // Reset ref jika gagal
        }
    };

    // Auto-submit when Time Up Modal is open
    useEffect(() => {
        if (isTimeUpModalOpen) {
            const timer = setTimeout(() => {
                confirmFinish();
            }, 3000); // Tunggu 3 detik agar user melihat pesan "Waktu Habis"
            return () => clearTimeout(timer);
        }
    }, [isTimeUpModalOpen]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // --- PERMANENT LOCK OVERLAY ---
    if (isPermanentLocked) {
        return (
            <div className="min-h-screen bg-red-900 flex flex-col items-center justify-center p-4 text-center z-50 fixed inset-0">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Ujian Terkunci Permanen</h2>
                    <p className="text-slate-600 mb-6">
                        Anda telah mencapai batas maksimal pelanggaran ({violationCount}/{MAX_VIOLATIONS}). <br />
                        <span className="font-bold text-red-600">Silakan hubungi pengawas ujian untuk membuka kunci.</span>
                    </p>

                    <button
                        onClick={checkUnlockStatus}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mb-3"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Cek Status Unlock
                    </button>

                    <button
                        onClick={() => navigate('/student-dashboard')}
                        className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // --- TEMPORARY LOCK OVERLAY ---
    if (isLocked) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center z-50 fixed inset-0">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Peringatan Keamanan</h2>
                    <p className="text-slate-600 mb-6">
                        Sistem mendeteksi aktivitas mencurigakan: <br />
                        <span className="font-bold text-red-600">{lockReason}</span>
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                        <h4 className="font-bold text-yellow-800 text-sm flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            Pelanggaran: {violationCount}/{MAX_VIOLATIONS}
                        </h4>
                        <p className="text-xs text-yellow-700">
                            Jika mencapai batas maksimal, ujian akan terkunci permanen dan hanya bisa dibuka oleh pengawas.
                        </p>
                    </div>

                    <button
                        onClick={enterFullscreen}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                        <Maximize className="w-5 h-5" />
                        Masuk Mode Fullscreen & Lanjutkan
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <p className="text-slate-500 mb-2">Tidak ada soal yang tersedia.</p>
                    <button onClick={() => navigate('/student-dashboard')} className="text-blue-600 hover:underline">
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col h-screen overflow-hidden select-none">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileNavOpen(true)}
                        className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <img src="/logo.png" alt="Sibentik Exam" className="w-8 h-8 rounded-lg object-contain bg-white shadow-sm" />
                    <div className="hidden sm:block">
                        <h1 className="font-bold text-slate-800 text-sm md:text-lg leading-tight line-clamp-1">{exam?.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Cloud Status Indicator - Hidden on very small screens */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 transition-all">
                        {saveStatus === 'saved' && (
                            <>
                                <Cloud className="w-4 h-4 text-green-500" />
                                <span className="text-xs font-medium text-slate-600">Tersimpan</span>
                            </>
                        )}
                        {saveStatus === 'saving' && (
                            <>
                                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-xs font-medium text-slate-600">Menyimpan...</span>
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <CloudOff className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-medium text-red-600">Gagal</span>
                            </>
                        )}
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-mono font-bold text-sm md:text-xl ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                        <Clock className="w-4 h-4 md:w-5 md:h-5" />
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Question Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-8 min-h-[300px] md:min-h-[400px]">
                            <div className="flex justify-between items-start mb-4 md:mb-6">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs md:text-sm">
                                    Soal No. {currentQuestionIndex + 1}
                                </span>
                                <span className="text-slate-400 text-xs md:text-sm">
                                    {currentQuestion.points} Poin
                                </span>
                            </div>

                            {/* Question Content */}
                            <div
                                className="prose prose-sm md:prose-lg max-w-none mb-6 md:mb-8 text-slate-800"
                                dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
                            />

                            {/* Options / Essay Input */}
                            {currentQuestion.type === 'essay' ? (
                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Jawaban Essay:</label>
                                    <textarea
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                        className="w-full h-48 p-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-slate-800"
                                        placeholder="Tulis jawaban uraian Anda di sini..."
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option) => (
                                        <label
                                            key={option.id}
                                            className={`flex items-start p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99] ${answers[currentQuestion.id] === option.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center h-6">
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestion.id}`}
                                                    value={option.id}
                                                    checked={answers[currentQuestion.id] === option.id}
                                                    onChange={() => handleAnswer(currentQuestion.id, option.id)}
                                                    className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                />
                                            </div>
                                            <span className="ml-3 text-slate-700 font-medium text-sm md:text-base leading-relaxed">{option.text}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Navigation Buttons (Desktop Only) */}
                            <div className="hidden md:flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-4 md:px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 text-sm md:text-base"
                                >
                                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                                    Sebelumnya
                                </button>

                                {currentQuestionIndex === questions.length - 1 ? (
                                    <button
                                        onClick={handleFinishClick}
                                        disabled={isSubmitting}
                                        className={`px-4 md:px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm md:text-base ${Object.keys(answers).length < questions.length
                                            ? 'bg-slate-400 text-slate-100 cursor-not-allowed opacity-80'
                                            : (isSubmitting ? 'bg-green-500 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700')
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                                                Selesai
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        className="px-4 md:px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm md:text-base"
                                    >
                                        Selanjutnya
                                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex justify-between items-center lg:hidden z-10">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Prev
                    </button>

                    <span className="text-sm font-bold text-slate-600">
                        {currentQuestionIndex + 1} / {questions.length}
                    </span>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={handleFinishClick}
                            disabled={isSubmitting}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1 text-sm ${isSubmitting
                                ? 'bg-green-500 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white'
                                }`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            Selesai
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold flex items-center gap-1 text-sm"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Sidebar Navigation (Desktop) */}
                <aside className="w-80 bg-white border-l border-slate-200 flex flex-col hidden lg:flex">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-1">Navigasi Soal</h3>
                        <p className="text-sm text-slate-500">
                            {Object.keys(answers).length} dari {questions.length} soal terjawab
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-5 gap-3">
                            {questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all ${currentQuestionIndex === idx
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-200 ring-offset-2'
                                        : answers[q.id]
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50">
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-sm"></div> Dijawab
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-sm"></div> Aktif
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Kosong
                            </div>
                        </div>
                        <button
                            onClick={handleFinishClick}
                            disabled={isSubmitting}
                            className={`w-full py-3 rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2 ${isSubmitting
                                ? 'bg-green-500 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                'Kumpulkan Jawaban'
                            )}
                        </button>
                    </div>
                </aside>

                {/* Mobile Navigation Drawer */}
                {isMobileNavOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileNavOpen(false)}></div>
                        <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-white shadow-xl flex flex-col animate-in slide-in-from-left duration-200">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-slate-800">Navigasi Soal</h3>
                                    <p className="text-xs text-slate-500">
                                        {Object.keys(answers).length} dari {questions.length} terjawab
                                    </p>
                                </div>
                                <button onClick={() => setIsMobileNavOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((q, idx) => (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                setCurrentQuestionIndex(idx);
                                                setIsMobileNavOpen(false);
                                            }}
                                            className={`aspect-square rounded-lg font-bold text-sm flex items-center justify-center transition-all ${currentQuestionIndex === idx
                                                ? 'bg-blue-600 text-white ring-2 ring-blue-200 ring-offset-2'
                                                : answers[q.id]
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50">
                                <button
                                    onClick={() => {
                                        setIsMobileNavOpen(false);
                                        handleFinishClick();
                                    }}
                                    disabled={isSubmitting}
                                    className={`w-full py-3 rounded-xl font-bold transition-colors shadow-sm text-sm flex items-center justify-center gap-2 ${isSubmitting
                                        ? 'bg-green-500 text-white cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        'Kumpulkan Jawaban'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}



                {/* TIME UP MODAL (FORCE SUBMIT) */}
                {isTimeUpModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-red-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <Clock className="w-10 h-10" />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Waktu Habis!</h3>
                            <p className="text-slate-500 mb-8">
                                Waktu pengerjaan ujian telah berakhir. <br />
                                <span className="font-bold text-slate-700">Jawaban Anda sedang dikumpulkan otomatis...</span>
                            </p>

                            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full animate-progress-indeterminate"></div>
                            </div>

                            <p className="text-xs text-slate-400">Mohon tunggu sebentar...</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StudentExamPage;
