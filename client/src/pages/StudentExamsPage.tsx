import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
    ListTodo,
    Calendar,
    Clock,
    Search,
    CheckCircle,
    PlayCircle,
    Lock,
    Hourglass,
    X,
    KeyRound,
    AlertCircle,
    ArrowRight,
    XCircle,
    Loader2
} from 'lucide-react';

interface Exam {
    id: number;
    title: string;
    subject: string;
    start_time: string;
    end_time: string;
    duration: number;
    is_active: boolean;
    student_status?: 'not_started' | 'ongoing' | 'completed';
}

const StudentExamsPage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // State untuk Modal Token
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [tokenInput, setTokenInput] = useState('');
    const [tokenError, setTokenError] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const fetchExams = async () => {
            if (!user?.id) return;
            try {
                const response = await api.get(`/exams?studentId=${user.id}`);
                setExams(response.data);
            } catch (error) {
                console.error('Gagal mengambil data ujian', error);
                showToast('Gagal memuat daftar ujian', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [user?.id, showToast]);

    const handleStartClick = (exam: Exam) => {
        if (exam.student_status === 'ongoing') {
            navigate(`/exam/${exam.id}`);
            return;
        }

        // Buka Modal Token
        setSelectedExam(exam);
        setTokenInput('');
        setTokenError('');
        setIsTokenModalOpen(true);
    };

    const submitToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tokenInput || !selectedExam) return;

        setVerifying(true);
        setTokenError('');

        try {
            await api.post(`/exams/${selectedExam.id}/verify-token`, {
                token: tokenInput,
                studentId: user?.id
            });

            setIsTokenModalOpen(false);
            showToast('Token valid! Memulai ujian...', 'success');
            navigate(`/exam/${selectedExam.id}`);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Token tidak valid.';
            setTokenError(msg);
            showToast(msg, 'error');
        } finally {
            setVerifying(false);
        }
    };

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (exam: Exam) => {
        const now = new Date();
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);

        if (exam.student_status === 'completed') {
            return (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                    <CheckCircle className="w-3 h-3" /> Selesai
                </span>
            );
        }
        if (now >= start && now <= end) {
            return (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit animate-pulse">
                    <Hourglass className="w-3 h-3" /> Berlangsung
                </span>
            );
        }
        if (now < start) {
            return (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                    <Lock className="w-3 h-3" /> Akan Datang
                </span>
            );
        }
        return (
            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                <XCircle className="w-3 h-3" /> Berakhir
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 px-1 md:px-0 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                        <ListTodo className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Daftar Ujian</h1>
                        <p className="text-slate-500 text-sm">Pilih ujian yang tersedia.</p>
                    </div>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari mapel atau judul..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                </div>
            </div>

            {/* Grid Layout */}
            {filteredExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExams.map((exam) => {
                        const now = new Date();
                        const start = new Date(exam.start_time);
                        const end = new Date(exam.end_time);
                        const isOngoing = now >= start && now <= end;
                        const isExpired = now > end;

                        return (
                            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                                {/* Card Header */}
                                <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start">
                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {start.toLocaleString('id-ID', { month: 'short' })}
                                        </span>
                                        <span className="text-xl font-bold leading-none">
                                            {start.getDate()}
                                        </span>
                                    </div>
                                    {getStatusBadge(exam)}
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1">
                                    <div className="mb-4">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">
                                            {exam.subject}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-2">
                                            {exam.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span>
                                                {start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                {' - '}
                                                {end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Footer (Action) */}
                                <div className="p-5 pt-0 mt-auto">
                                    {exam.student_status === 'completed' ? (
                                        <button
                                            disabled
                                            className="w-full py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Sudah Dikerjakan
                                        </button>
                                    ) : isOngoing ? (
                                        <button
                                            onClick={() => handleStartClick(exam)}
                                            className={`w-full py-3 font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 ${exam.student_status === 'ongoing'
                                                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                        >
                                            {exam.student_status === 'ongoing' ? (
                                                <>
                                                    <PlayCircle className="w-5 h-5" /> Lanjutkan
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-5 h-5" /> Kerjakan
                                                </>
                                            )}
                                        </button>
                                    ) : isExpired ? (
                                        <button
                                            disabled
                                            className="w-full py-3 bg-red-50 text-red-400 font-bold rounded-xl cursor-not-allowed border border-red-100 flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Tidak Mengikuti
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-3 bg-slate-50 text-slate-400 font-bold rounded-xl cursor-not-allowed border border-slate-100"
                                        >
                                            Belum Tersedia
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Tidak ada ujian ditemukan</h3>
                    <p className="text-slate-500">Coba cari dengan kata kunci lain.</p>
                </div>
            )}

            {/* MODERN TOKEN MODAL */}
            {isTokenModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Masukkan Token</h3>
                            <button
                                onClick={() => setIsTokenModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <KeyRound className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1">{selectedExam?.title}</h4>
                            <p className="text-xs text-slate-500">{selectedExam?.subject}</p>
                        </div>

                        <form onSubmit={submitToken}>
                            <div className="mb-6">
                                <input
                                    type="text"
                                    value={tokenInput}
                                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                                    placeholder="TOKEN"
                                    className="w-full text-center text-2xl font-bold tracking-[0.2em] py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:tracking-normal placeholder:text-slate-300 uppercase"
                                    autoFocus
                                />
                                {tokenError && (
                                    <div className="flex items-center justify-center gap-1 text-red-500 text-xs mt-2 font-medium animate-in slide-in-from-top-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {tokenError}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!tokenInput || verifying}
                                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Memverifikasi...
                                    </>
                                ) : (
                                    <>
                                        Mulai Ujian <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentExamsPage;
