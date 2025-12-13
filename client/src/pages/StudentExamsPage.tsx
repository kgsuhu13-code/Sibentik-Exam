
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import StudentSidebar from '../components/StudentSidebar';
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
    Search,
    Menu
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        <div className="min-h-screen bg-slate-50 flex">
            <StudentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 p-6 md:p-10 w-full overflow-y-auto h-screen">
                {/* Mobile Header Toggle */}
                <div className="md:hidden flex items-center justify-between mb-8 sticky top-0 z-30 bg-slate-50/90 backdrop-blur-sm py-2">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200" />
                        <span className="text-lg font-extrabold text-slate-800 tracking-tight">Sibentik <span className="text-blue-600">Exam</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Daftar Ujian</h1>
                        <p className="text-slate-500 text-sm mt-1">Pilih dan kerjakan ujian yang tersedia untukmu.</p>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari ujian..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedExams.length > 0 ? (
                        sortedExams.map((exam) => {
                            const start = new Date(exam.start_time);
                            const { badge, action } = getStatusContent(exam);

                            return (
                                <div key={exam.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col h-full group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                                            {exam.subject}
                                        </span>
                                        {badge}
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                                        {exam.title}
                                    </h3>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-4">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span>{start.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span>{start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        {action}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Search className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Tidak ada ujian ditemukan</h3>
                            <p className="text-slate-500 text-sm">Coba kata kunci lain atau cek jadwal terbaru.</p>
                        </div>
                    )}
                </div>
            </div>
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
