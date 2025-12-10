import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Settings, Sparkles, X, Eye, EyeOff, CheckCircle, Printer, Cloud, CloudOff, Loader2, Globe } from 'lucide-react';
import api from '../services/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import 'katex/dist/katex.min.css';

// SweetAlert2 & Toastify
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showConfirm, showSuccess } from '../utils/alert';

// Modules dipindah ke dalam komponen agar bisa akses handler
const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'script',
    'list', 'indent',
    'direction',
    'link', 'image', 'formula'
];

interface Question {
    id: number;
    content: string;
    type: 'multiple_choice' | 'essay';
    options: any;
    correct_answer: string;
    points: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'draft';

const QuestionEditorPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const quillRef = React.useRef<ReactQuill>(null);
    // Refs untuk option editors (kita pakai array atau map jika perlu, tapi karena options statis A-E, kita handle logic uploadnya generic)

    // IMAGE HANDLER FUNCTION
    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const formData = new FormData();
                formData.append('image', file);

                // Show loading toast or cursor
                const loadingToast = toast.loading("Mengunggah gambar...");

                try {
                    const res = await api.post('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    const url = res.data.url; // URL dari server

                    // Insert into editor
                    const quill = quillRef.current?.getEditor();
                    if (quill) {
                        const range = quill.getSelection(true);
                        quill.insertEmbed(range.index, 'image', url);
                        // Move cursor next to image
                        quill.setSelection(range.index + 1);
                    }

                    toast.update(loadingToast, { render: "Gambar berhasil diunggah!", type: "success", isLoading: false, autoClose: 2000 });

                } catch (error) {
                    console.error("Upload failed", error);
                    toast.update(loadingToast, { render: "Gagal mengunggah gambar.", type: "error", isLoading: false, autoClose: 3000 });
                }
            }
        };
    }, []);

    // Custom modules with Request Handler
    const modules = React.useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }],
                ['link', 'image', 'formula'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), [imageHandler]);

    // Opsi modules (bisa sama atau simplified, kita pakai handler yang sama untuk konsistensi)
    // Note: ReactQuill untuk options dirender dalam loop, ref-nya susah diakses satu-satu secara clean untuk 'imageHandler' ini jika bergantung pada 'quillRef' utama.
    // TAPI: Handler di atas menggunakan 'quillRef' yg merujuk ke EDITOR UTAMA (Soal).
    // Untuk opsi jawaban, kita butuh pendekatan lain atau membiarkan opsi jawaban pakai Base64 (biasanya kecil). 
    // NAMUN: Lebih baik kita bikin generic handler jika memungkinkan, atau sementara kita terapkan Upload hanya untuk Soal UTAMA dulu yang sering gambar gede.
    // Untuk Opsi Jawaban: Jika ingin upload, kita harus capture Ref dari editor opsi yang sedang aktif. Agak kompleks di struktur sekarang.
    // KITA FOKUS KE EDITOR UTAMA DULU.

    // (Optional) Simple Option Modules without Image Upload for now to avoid complexity bugs, 
    // or keep Base64 for options (usually small icons/formulas).
    const optionModules = React.useMemo(() => ({
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            ['image', 'formula']
        ],
    }), []); // Default behavior (Base64) for options for now as requested 'soal pertanyaan' focus.
    const isCreatingRef = React.useRef(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [content, setContent] = useState('');
    const [type, setType] = useState<'multiple_choice' | 'essay'>('multiple_choice');
    const [options, setOptions] = useState({ A: '', B: '', C: '', D: '', E: '' });
    const [correctAnswer, setCorrectAnswer] = useState('A');
    const [points, setPoints] = useState(5);
    const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

    // Auto Save State
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

    const [pendingDraft, setPendingDraft] = useState<any>(null); // Untuk recovery
    const [showDraftRecoveryModal, setShowDraftRecoveryModal] = useState(false);

    // Preview State
    const [showPreview, setShowPreview] = useState(false);

    // Bank Details & Settings
    const [bankDetails, setBankDetails] = useState<any>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        is_random_question: false,
        is_random_answer: false,
        is_public: false
    });

    // Mass Update State
    const [targetTotalScore, setTargetTotalScore] = useState(100);
    const [isDistributingPoints, setIsDistributingPoints] = useState(false);

    // AI Generation State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState('Sedang');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Multi-select State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const fetchBankDetails = async () => {
        try {
            const response = await api.get(`/questions/banks/${id}`);
            setBankDetails(response.data);
            setSettingsForm({
                is_random_question: response.data.is_random_question,
                is_random_answer: response.data.is_random_answer,
                is_public: response.data.is_public
            });
        } catch (error) {
            console.error('Gagal mengambil detail bank soal', error);
            toast.error('Gagal mengambil detail bank soal');
        }
    };

    const updateBankSettings = async () => {
        setIsSavingSettings(true);
        try {
            await api.put(`/questions/banks/${id}`, settingsForm);
            setShowSettingsModal(false);
            fetchBankDetails();
            toast.success('Pengaturan berhasil disimpan');
        } catch (error) {
            console.error('Gagal update setting', error);
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const distributePoints = async () => {
        setIsDistributingPoints(true);
        try {
            // Hitung bobot per soal
            const totalQuestions = questions.length;
            if (totalQuestions === 0) {
                toast.warn('Belum ada soal untuk diatur bobotnya.');
                return;
            }

            const pointsPerQuestion = Number((targetTotalScore / totalQuestions).toFixed(2));

            // Konfirmasi ke user
            const confirm = await showConfirm(
                'Atur Ulang Bobot?',
                `Akan mengubah bobot ${totalQuestions} soal menjadi ${pointsPerQuestion} poin agar totalnya ${targetTotalScore}.`,
                'Ya, Atur!',
                'Batal',
                'question',
                'primary'
            );

            if (!confirm.isConfirmed) return;

            // Panggil API untuk update massal (kita perlu endpoint baru atau loop di frontend)
            // Untuk amannya dan lebih cepat, kita loop di frontend lalu panggil API update per soal
            // TAPI: Idealnya ada endpoint batch update. 
            // SEMENTARA: Kita update satu-satu dengan Promise.all agar UI tetap responsif.
            // ATAU: Kita buat endpoint khusus di backend (rekomendasi terbaik).

            // Mari kita coba cek apakah endpoint soal support update parsial. 
            // Kita gunakan Promise.all untuk update parallel.

            const updatePromises = questions.map(q =>
                api.put(`/questions/questions/${q.id}`, {
                    ...q, // kirim data lain tetap sama
                    points: pointsPerQuestion,
                    type: q.type, // Required fields
                    content: q.content,
                    bank_id: id
                })
            );

            await Promise.all(updatePromises);

            // Update state lokal
            setQuestions(prev => prev.map(q => ({ ...q, points: pointsPerQuestion })));
            if (selectedQuestionId) {
                setPoints(pointsPerQuestion);
            }

            toast.success(`Berhasil mengatur ulang bobot menjadi ${pointsPerQuestion} per soal.`);
            setShowSettingsModal(false);

        } catch (error) {
            console.error('Gagal update bobot massal', error);
            toast.error('Gagal memperbarui bobot soal.');
        } finally {
            setIsDistributingPoints(false);
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await api.get(`/questions/banks/${id}/questions`);
            setQuestions(response.data);
        } catch (error) {
            console.error('Gagal mengambil soal', error);
            toast.error('Gagal memuat daftar soal');
        } finally {
            setLoading(false);
        }
    };

    // Check LocalStorage for drafts when selecting a question
    const checkDraft = (questionId: number) => {
        const draftKey = `question_draft_bank_${id}_q_${questionId}`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            setPendingDraft(parsedDraft);
            setShowDraftRecoveryModal(true);
            return true;
        }
        return false;
    };

    const loadQuestion = (q: Question) => {
        setSelectedQuestionId(q.id);
        const hasDraft = checkDraft(q.id);

        if (!hasDraft) {
            setContent(q.content);
            setType(q.type);
            setPoints(q.points);
            if (q.type === 'multiple_choice') {
                setOptions(q.options);
                setCorrectAnswer(q.correct_answer);
            } else {
                setOptions({ A: '', B: '', C: '', D: '', E: '' });
                setCorrectAnswer('A');
            }
            setSaveStatus('saved');
        }
    };

    const handleDelete = async () => {
        if (!selectedQuestionId) return;

        const result = await showConfirm(
            'Hapus Soal?',
            "Tindakan ini tidak dapat dibatalkan!",
            'Ya, Hapus!',
            'Batal',
            'warning',
            'danger'
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/questions/questions/${selectedQuestionId}`);
                localStorage.removeItem(`question_draft_bank_${id}_q_${selectedQuestionId}`);

                setContent('');
                setOptions({ A: '', B: '', C: '', D: '', E: '' });
                setCorrectAnswer('A');
                setSelectedQuestionId(null);
                fetchQuestions();

                await showSuccess('Terhapus!', 'Soal berhasil dihapus.');
            } catch (error) {
                console.error('Gagal menghapus soal', error);
                toast.error('Gagal menghapus soal');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await showConfirm(
            'Hapus Banyak Soal?',
            `Anda akan menghapus ${selectedIds.length} soal terpilih. Tindakan ini tidak dapat dibatalkan!`,
            `Ya, Hapus ${selectedIds.length} Soal`,
            'Batal',
            'warning',
            'danger'
        );

        if (result.isConfirmed) {
            try {
                await api.post('/questions/questions/bulk-delete', { ids: selectedIds });

                // Cleanup local storage drafts
                selectedIds.forEach(qid => {
                    localStorage.removeItem(`question_draft_bank_${id}_q_${qid}`);
                });

                // Reset state
                setSelectedIds([]);
                setIsSelectionMode(false);

                // If currently selected question was deleted, reset editor
                if (selectedQuestionId && selectedIds.includes(selectedQuestionId)) {
                    setContent('');
                    setOptions({ A: '', B: '', C: '', D: '', E: '' });
                    setCorrectAnswer('A');
                    setSelectedQuestionId(null);
                }

                fetchQuestions();
                await showSuccess('Terhapus!', `${selectedIds.length} soal berhasil dihapus.`);
            } catch (error) {
                console.error('Gagal hapus massal', error);
                toast.error('Gagal menghapus soal terpilih');
            }
        }
    };

    const toggleSelection = (qid: number) => {
        setSelectedIds(prev =>
            prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]
        );
    };

    useEffect(() => {
        fetchQuestions();
        fetchBankDetails();
    }, [id]);

    // --- AUTO SAVE LOGIC ---

    const saveToLocalStorage = useCallback(() => {
        const key = `question_draft_bank_${id}_q_${selectedQuestionId || 'new'}`;
        const data = {
            content,
            type,
            options,
            correctAnswer,
            points,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(data));

    }, [id, selectedQuestionId, content, type, options, correctAnswer, points]);

    const performAutoSave = useCallback(async () => {
        if (!content) return;

        setSaveStatus('saving');

        const payload = {
            bank_id: id,
            type,
            content,
            options: type === 'multiple_choice' ? options : null,
            correct_answer: type === 'multiple_choice' ? correctAnswer : null,
            points
        };

        try {
            if (selectedQuestionId) {
                await api.put(`/questions/questions/${selectedQuestionId}`, payload);
                localStorage.removeItem(`question_draft_bank_${id}_q_${selectedQuestionId}`);
            } else {
                if (isCreatingRef.current) return;
                isCreatingRef.current = true;

                try {
                    const res = await api.post('/questions/questions', payload);
                    setSelectedQuestionId(res.data.id);
                    localStorage.removeItem(`question_draft_bank_${id}_q_new`);
                    fetchQuestions();
                } finally {
                    isCreatingRef.current = false;
                }
            }

            setSaveStatus('saved');

        } catch (error) {
            console.error("Auto-save failed, falling back to LocalStorage", error);
            saveToLocalStorage();
            setSaveStatus('error');
            toast.warn('Koneksi terputus. Disimpan ke Draft Lokal.', { autoClose: 2000 });
        }
    }, [id, selectedQuestionId, content, type, options, correctAnswer, points, saveToLocalStorage]);

    useEffect(() => {
        if (loading) return;

        const timer = setTimeout(() => {
            performAutoSave();
        }, 2000);

        return () => clearTimeout(timer);
    }, [content, type, options, correctAnswer, points, performAutoSave, loading]);


    const handleManualSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus('saving');

        try {
            const payload = {
                bank_id: id,
                type,
                content,
                options: type === 'multiple_choice' ? options : null,
                correct_answer: type === 'multiple_choice' ? correctAnswer : null,
                points
            };

            if (selectedQuestionId) {
                await api.put(`/questions/questions/${selectedQuestionId}`, payload);
                localStorage.removeItem(`question_draft_bank_${id}_q_${selectedQuestionId}`);
            } else {
                const res = await api.post('/questions/questions', payload);
                setSelectedQuestionId(res.data.id);
                localStorage.removeItem(`question_draft_bank_${id}_q_new`);
            }

            setSaveStatus('saved');

            fetchQuestions();

            await showSuccess('Berhasil!', 'Soal berhasil disimpan!');
        } catch (error) {
            console.error('Gagal menyimpan soal', error);
            saveToLocalStorage();
            setSaveStatus('error');
            toast.error('Gagal menyimpan ke server. Data tersimpan di Draft Lokal.');
        }
    };

    const handleGenerateAi = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            await api.post('/questions/generate-ai', {
                bank_id: id,
                topic: aiTopic,
                count: aiCount,
                difficulty: aiDifficulty
            });
            setShowAiModal(false);
            setAiTopic('');
            fetchQuestions();

            await showSuccess('Berhasil!', 'Soal berhasil dibuat oleh AI! Silakan cek daftar soal.');
        } catch (error) {
            console.error('Gagal generate AI', error);
            toast.error('Gagal generate soal dengan AI');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />

            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/question-bank')}
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700"
                        title="Kembali"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800 leading-tight">
                            {bankDetails ? bankDetails.title : 'Editor Soal'}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">
                            {bankDetails ? `${bankDetails.subject} • Kelas ${bankDetails.class_level}` : `Bank ID: ${id}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Auto Save Indicator */}
                    <div className="flex items-center gap-2 mr-4 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                        {saveStatus === 'saving' && (
                            <>
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-xs text-slate-500 font-medium">Menyimpan...</span>
                            </>
                        )}
                        {saveStatus === 'saved' && (
                            <>
                                <Cloud className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-slate-500 font-medium">Tersimpan</span>
                            </>
                        )}
                        {saveStatus === 'draft' && (
                            <>
                                <Cloud className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-slate-500 font-medium">Draft (Lokal)</span>
                            </>
                        )}
                        {saveStatus === 'error' && (
                            <>
                                <CloudOff className="w-4 h-4 text-red-500" />
                                <span className="text-xs text-red-500 font-medium">Offline / Gagal</span>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${showPreview
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                    >
                        {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showPreview ? 'Tutup Preview' : 'Preview Semua Soal'}
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Soal</span>
                        <span className="bg-white px-2 py-0.5 rounded-md text-sm font-bold text-slate-700 shadow-sm border border-slate-100">
                            {questions.length}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                        title="Pengaturan"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-slate-500 text-sm font-medium">Memuat data soal...</p>
                    </div>
                </div>
            ) : showPreview ? (
                // FULL PREVIEW MODE (ALL QUESTIONS)
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex justify-center">
                    <div className="w-full max-w-5xl pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                        {/* Preview Header */}
                        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">Preview Bank Soal</h3>
                                    <p className="text-blue-100 text-sm mt-1">
                                        Menampilkan {questions.length} soal dalam format simulasi ujian.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Cetak
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
                                >
                                    Kembali ke Editor
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        {questions.length > 0 ? (
                            questions.map((q, index) => (
                                <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 break-inside-avoid">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">
                                            Soal No. {index + 1}
                                        </span>
                                        <span className="text-slate-400 text-sm font-medium bg-slate-50 px-2 py-1 rounded">
                                            {q.points} Poin
                                        </span>
                                    </div>

                                    {/* Question Content */}
                                    <div
                                        className="prose prose-lg max-w-none mb-8 text-slate-800"
                                        dangerouslySetInnerHTML={{ __html: q.content }}
                                    />

                                    {/* Options */}
                                    {q.type === 'essay' ? (
                                        <div className="mt-4">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Jawaban Essay (Siswa):</label>
                                            <div className="w-full h-32 p-4 bg-slate-50 border border-slate-300 rounded-xl border-dashed flex items-center justify-center text-slate-400 text-sm italic">
                                                Area jawaban siswa (Essay)
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                                                <div
                                                    key={opt}
                                                    className={`flex items-start p-4 rounded-xl border-2 transition-all ${q.correct_answer === opt
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center h-6">
                                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${q.correct_answer === opt ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 text-slate-500 bg-slate-50'
                                                            }`}>
                                                            {opt}
                                                        </div>
                                                    </div>
                                                    <div className="ml-3 flex-1">
                                                        <span className={`font-medium text-base leading-relaxed ${q.correct_answer === opt ? 'text-green-800' : 'text-slate-700'
                                                            }`}>
                                                            {(q.options as any)[opt] ? (
                                                                <div dangerouslySetInnerHTML={{ __html: (q.options as any)[opt] }} />
                                                            ) : (
                                                                <span className="text-slate-400 italic">Opsi kosong...</span>
                                                            )}
                                                        </span>
                                                        {q.correct_answer === opt && (
                                                            <div className="mt-1">
                                                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                                                                    <CheckCircle className="w-3 h-3" /> Kunci Jawaban
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                                <p className="text-slate-400 font-medium">Belum ada soal yang dibuat.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // EDITOR MODE (Split View)
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar: Navigation */}
                    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Soal</h2>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        setSelectedIds([]);
                                    }}
                                    className={`text-xs font-bold px-2 py-1 rounded transition-colors ${isSelectionMode ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600'
                                        }`}
                                >
                                    {isSelectionMode ? 'Batal Pilih' : 'Pilih'}
                                </button>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, index) => (
                                    <button
                                        key={q.id}
                                        onClick={() => isSelectionMode ? toggleSelection(q.id) : loadQuestion(q)}
                                        className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all border relative ${isSelectionMode
                                            ? selectedIds.includes(q.id)
                                                ? 'bg-red-50 text-red-600 border-red-500' // Selected for deletion
                                                : 'bg-white text-slate-400 border-slate-200 hover:border-red-300'
                                            : selectedQuestionId === q.id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {index + 1}
                                        {isSelectionMode && selectedIds.includes(q.id) && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                                        )}
                                    </button>
                                ))}
                                {!isSelectionMode && (
                                    <button
                                        onClick={() => {
                                            // Cek draft soal baru
                                            const hasDraft = checkDraft(0); // 0 atau 'new'
                                            if (!hasDraft) {
                                                setContent('');
                                                setOptions({ A: '', B: '', C: '', D: '', E: '' });
                                                setCorrectAnswer('A');
                                                setSelectedQuestionId(null);
                                                setSaveStatus('idle');
                                            }
                                        }}
                                        className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                        title="Tambah Soal"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {isSelectionMode ? (
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.length === 0}
                                    className={`w-full mt-4 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-md transition-all ${selectedIds.length > 0
                                        ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02]'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Hapus {selectedIds.length} Soal
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowAiModal(true)}
                                    className="w-full mt-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Generate with AI
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-800 mb-1">Tips Editor</h3>
                                <p className="text-xs text-blue-600 leading-relaxed">
                                    Perubahan Anda disimpan otomatis. Icon awan di atas menunjukkan status penyimpanan.
                                </p>
                            </div>
                        </div>

                        {selectedQuestionId && (
                            <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <button
                                    onClick={handleDelete}
                                    className="w-full py-2.5 flex items-center justify-center gap-2 text-red-600 bg-white border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg transition-all text-sm font-medium shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Hapus Soal Ini
                                </button>
                            </div>
                        )}
                    </aside>

                    {/* Main Editor Area */}
                    <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 flex justify-center relative">
                        <div className="w-full max-w-4xl pb-20">
                            <form onSubmit={handleManualSave} className="space-y-6 animate-in fade-in duration-300">
                                {/* Editor Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    {/* Toolbar Area */}
                                    <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Soal</label>
                                                <select
                                                    value={type}
                                                    onChange={(e) => setType(e.target.value as any)}
                                                    className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-40 p-2"
                                                >
                                                    <option value="multiple_choice">Pilihan Ganda</option>
                                                    <option value="essay">Essay / Uraian</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col w-24">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bobot</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={points}
                                                        onChange={(e) => setPoints(Number(e.target.value))}
                                                        className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 pr-8"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Pt</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <button
                                                type="submit"
                                                disabled={saveStatus === 'saving'}
                                                className={`px-6 py-2 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center gap-2 ${saveStatus === 'saving'
                                                    ? 'bg-blue-400 text-white cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    }`}
                                            >
                                                {saveStatus === 'saving' ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Menyimpan...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Simpan Manual
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Question Content */}
                                    <div className="p-6">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Pertanyaan</label>

                                        {/* Quick Math Toolbar */}
                                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-100 rounded-lg border border-slate-200">
                                            <span className="text-xs font-bold text-slate-500 flex items-center mr-2">Simbol Cepat:</span>
                                            {['×', '÷', '±', '≈', '≠', '≤', '≥', 'π', 'α', 'β', 'θ', '°', '²', '³', '½', '¼', '∞'].map((sym) => (
                                                <button
                                                    key={sym}
                                                    type="button"
                                                    onClick={() => {
                                                        const quill = quillRef.current?.getEditor();
                                                        if (quill) {
                                                            const range = quill.getSelection(true);
                                                            quill.insertText(range.index, sym);
                                                            quill.setSelection(range.index + 1);
                                                        }
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 font-serif text-lg shadow-sm transition-all"
                                                    title={`Sisipkan ${sym}`}
                                                >
                                                    {sym}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="prose-editor">
                                            <ReactQuill
                                                ref={quillRef}
                                                theme="snow"
                                                value={content}
                                                onChange={setContent}
                                                modules={modules}
                                                formats={formats}
                                                className="h-64 mb-12"
                                                placeholder="Tulis pertanyaan Anda di sini... Gunakan screenshot (Ctrl+V) untuk rumus rumit."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Options Card (Only for Multiple Choice) */}
                                {type === 'multiple_choice' && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            Pilihan Jawaban
                                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Pilih kunci jawaban dengan mengklik huruf</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                                                <div
                                                    key={opt}
                                                    className={`group flex items-start gap-4 p-3 rounded-xl border transition-all duration-200 ${correctAnswer === opt
                                                        ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => setCorrectAnswer(opt)}
                                                        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm transition-all mt-1 ${correctAnswer === opt
                                                            ? 'bg-blue-600 text-white shadow-md scale-110'
                                                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-600'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <ReactQuill
                                                            theme="snow"
                                                            value={(options as any)[opt]}
                                                            onChange={(val) => setOptions(prev => ({ ...prev, [opt]: val }))}
                                                            modules={optionModules}
                                                            formats={formats}
                                                            className="bg-white [&_.ql-editor]:min-h-[60px] [&_.ql-container]:border-slate-300 [&_.ql-toolbar]:border-slate-300 [&_.ql-toolbar]:bg-slate-50 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg"
                                                            placeholder={`Tulis jawaban untuk opsi ${opt}...`}
                                                        />
                                                    </div>
                                                    {correctAnswer === opt && (
                                                        <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-md mt-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wide">Kunci</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </main>
                </div>
            )}

            {/* Draft Recovery Modal */}
            {showDraftRecoveryModal && pendingDraft && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                    <Cloud className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Draft Ditemukan!</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowDraftRecoveryModal(false);
                                    setPendingDraft(null);
                                    localStorage.removeItem(`question_draft_bank_${id}_q_new`);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
                            <p className="text-sm text-slate-600 mb-3">
                                Kami menemukan draft soal yang belum tersimpan dari sesi sebelumnya:
                            </p>
                            <div className="text-xs text-slate-500 space-y-1">
                                <p><strong>Waktu tersimpan:</strong> {new Date(pendingDraft.savedAt).toLocaleString('id-ID')}</p>
                                <p><strong>Tipe soal:</strong> {pendingDraft.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}</p>
                                <p><strong>Preview:</strong></p>
                                <div
                                    className="mt-2 p-2 bg-white rounded border border-slate-200 max-h-24 overflow-y-auto text-slate-700"
                                    dangerouslySetInnerHTML={{ __html: pendingDraft.content?.substring(0, 200) + '...' }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDraftRecoveryModal(false);
                                    setPendingDraft(null);
                                    localStorage.removeItem(`question_draft_bank_${id}_q_new`);
                                }}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-colors"
                            >
                                Abaikan Draft
                            </button>
                            <button
                                onClick={() => {
                                    // Restore draft
                                    setContent(pendingDraft.content || '');
                                    setType(pendingDraft.type || 'multiple_choice');
                                    setOptions(pendingDraft.options || { A: '', B: '', C: '', D: '', E: '' });
                                    setCorrectAnswer(pendingDraft.correctAnswer || 'A');
                                    setPoints(pendingDraft.points || 5);
                                    setShowDraftRecoveryModal(false);
                                    setPendingDraft(null);
                                    setSaveStatus('draft');
                                }}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm shadow-sm hover:shadow transition-all"
                            >
                                Pulihkan Draft
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Pengaturan Bank Soal</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Close</span>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.is_random_question}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, is_random_question: e.target.checked })}
                                        className="peer w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Acak Urutan Soal</span>
                                    <span className="block text-xs text-slate-500 mt-0.5">Soal akan tampil acak untuk setiap siswa</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={settingsForm.is_random_answer}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, is_random_answer: e.target.checked })}
                                        className="peer w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">Acak Pilihan Jawaban</span>
                                    <span className="block text-xs text-slate-500 mt-0.5">Opsi A-E akan diacak otomatis</span>
                                </div>
                            </label>
                        </div>

                        {/* Mass Points Distribution */}
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <h4 className="font-bold text-sm text-blue-800 mb-2 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Otomatisasi Bobot Nilai
                            </h4>
                            <div className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Target Total Nilai</label>
                                    <input
                                        type="number"
                                        value={targetTotalScore}
                                        onChange={(e) => setTargetTotalScore(Number(e.target.value))}
                                        className="w-full mt-1 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                    />
                                </div>
                                <button
                                    onClick={distributePoints}
                                    disabled={isDistributingPoints || questions.length === 0}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-[34px]"
                                >
                                    {isDistributingPoints ? 'Memproses...' : 'Ratakan Bobot'}
                                </button>
                            </div>
                            <p className="text-[10px] text-blue-600 mt-2 leading-tight">
                                Sistem akan membagi rata target nilai ke {questions.length} soal yang ada.
                            </p>
                        </div>

                        {/* Public/Private Toggle */}
                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    Publikasikan Bank Soal?
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                                    Jika aktif, bank soal ini dapat dilihat dan diduplikat oleh guru lain.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settingsForm.is_public}
                                    onChange={(e) => setSettingsForm({ ...settingsForm, is_public: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-sm transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={updateBankSettings}
                                disabled={isSavingSettings}
                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 ${isSavingSettings
                                    ? 'bg-blue-400 text-white cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {isSavingSettings ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Pengaturan'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Generation Modal */}
            {showAiModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Generate Soal dengan AI</h3>
                            </div>
                            <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Close</span>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGenerateAi} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Topik / Materi</label>
                                <textarea
                                    required
                                    value={aiTopic}
                                    onChange={(e) => setAiTopic(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all h-24 resize-none"
                                    placeholder="Contoh: Hukum Newton, Past Tense, Aljabar Dasar..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Soal</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={aiCount}
                                        onChange={(e) => setAiCount(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Tingkat Kesulitan</label>
                                    <select
                                        value={aiDifficulty}
                                        onChange={(e) => setAiDifficulty(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-white transition-all"
                                    >
                                        <option value="Mudah">Mudah</option>
                                        <option value="Sedang">Sedang</option>
                                        <option value="Sulit">Sulit</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${isGenerating
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg hover:scale-[1.02]'
                                        }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Sedang Membuat Soal...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate Sekarang
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-slate-400 mt-3">
                                    AI akan membuatkan soal pilihan ganda beserta kunci jawabannya secara otomatis.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionEditorPage;
