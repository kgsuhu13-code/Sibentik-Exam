
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
    ListTodo,
    Calendar,
    Clock,
    CheckCircle,
    PlayCircle,
    Lock,
    Hourglass,
    X,
    AlertCircle,
    XCircle,
    LayoutDashboard,
    History,
    Search
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

    const getStatusContent = (exam: Exam) => {
        const now = new Date();
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);

        if (exam.student_status === 'completed') {
            return {
                badge: <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Selesai</span>,
                action: null
            };
        }
        if (now >= start && now <= end) {
            return {
                badge: <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 w-fit animate-pulse"><Hourglass className="w-3 h-3" /> Berlangsung</span>,
                action: (
                    <button
                        onClick={() => handleStartClick(exam)}
                        className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-blue-700"
                    >
                        <PlayCircle className="w-5 h-5 fill-current" /> Kerjakan Sekarang
                    </button>
                )
            };
        }
        if (now < start) {
            return {
                badge: <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 w-fit"><Lock className="w-3 h-3" /> Belum Mulai</span>,
                action: (
                    <button disabled className="w-full mt-4 py-3 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" /> Segera Hadir
                    </button>
                )
            };
        }
        return {
            badge: <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Berakhir</span>,
            action: null
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Filter & Sort
    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedExams = [...filteredExams].sort((a, b) => {
        const now = new Date();
        const startA = new Date(a.start_time);
        const endA = new Date(a.end_time);
        const startB = new Date(b.start_time);
        const endB = new Date(b.end_time);

        const isOngoingA = now >= startA && now <= endA && a.student_status !== 'completed';
        const isOngoingB = now >= startB && now <= endB && b.student_status !== 'completed';

        if (isOngoingA && !isOngoingB) return -1;
        if (!isOngoingA && isOngoingB) return 1;

        return startA.getTime() - startB.getTime();
    });

    return (
        <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden pb-20">

            {/* --- TOP SECTION --- */}
            <div className="px-6 pt-10 pb-8 bg-white z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                            <ListTodo className="w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                                Daftar Ujian
                            </h1>
                            <p className="text-slate-500 text-xs font-medium mt-0.5">Jadwal ujian yang tersedia untukmu.</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Cari ujian..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all font-medium text-slate-700 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* --- BOTTOM SECTION (BLUE GRADIENT) --- */}
            <div className="flex-1 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(37,99,235,0.2)] relative z-0 pt-8 pb-24 -mt-4 overflow-hidden">

                {/* Decoration Circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="relative z-10 px-6 h-full overflow-y-auto pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {sortedExams.length > 0 ? (
                            sortedExams.map((exam) => {
                                const start = new Date(exam.start_time);
                                const end = new Date(exam.end_time);
                                const { badge, action } = getStatusContent(exam);

                                return (
                                    <div key={exam.id} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-blue-900/10 border border-slate-100 relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                                {exam.subject}
                                            </span>
                                            {badge}
                                        </div>

                                        <h3 className="text-lg font-extrabold text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                            {exam.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-fit mb-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span>{start.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                            <div className="w-px h-3 bg-slate-300 mx-1"></div>
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span>{start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>

                                        {action}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/80">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 text-white">
                                    <Search className="w-8 h-8" />
                                </div>
                                <p className="text-lg font-bold">Tidak ada ujian ditemukan</p>
                                <p className="text-sm opacity-70">Coba kata kunci lain atau cek lagi nanti.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <button
                        onClick={() => navigate('/student-dashboard')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600`}
                    >
                        <LayoutDashboard className="w-6 h-6" strokeWidth={2} />
                        <span className="text-[10px] font-medium">Dashboard</span>
                    </button>

                    <button
                        onClick={() => navigate('/student-exams')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-blue-600`}
                    >
                        <ListTodo className="w-6 h-6" strokeWidth={2.5} />
                        <span className="text-[10px] font-medium">Ujian</span>
                    </button>

                    <button
                        onClick={() => navigate('/student-history')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600`}
                    >
                        <History className="w-6 h-6" strokeWidth={2} />
                        <span className="text-[10px] font-medium">Riwayat</span>
                    </button>
                </div>
            </div>

            {/* MODERN TOKEN MODAL */}
            {isTokenModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom duration-300 pb-10">
                        <div className="flex justify-center mb-2">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
                        </div>

                        <div className="flex justify-between items-start mb-6 mt-4">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-800">Mulai Ujian</h3>
                                <p className="text-slate-500 text-sm mt-1">{selectedExam?.title}</p>
                            </div>
                            <button
                                onClick={() => setIsTokenModalOpen(false)}
                                className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitToken}>
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Masukkan Kode Token</label>
                                <input
                                    type="text"
                                    value={tokenInput}
                                    onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                                    placeholder="• • • • • •"
                                    className="w-full text-center text-3xl font-bold tracking-[0.3em] py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 uppercase text-slate-800"
                                    autoFocus
                                />
                                {tokenError && (
                                    <div className="flex items-center justify-center gap-1.5 text-red-500 text-sm mt-3 font-bold animate-pulse">
                                        <AlertCircle className="w-4 h-4" />
                                        {tokenError}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={!tokenInput || verifying}
                                className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-200"
                            >
                                {verifying ? 'Memproses...' : 'Mulai Mengerjakan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentExamsPage;
