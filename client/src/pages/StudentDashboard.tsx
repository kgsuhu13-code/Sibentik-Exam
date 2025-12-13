
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import StudentSidebar from '../components/StudentSidebar';
import {
    BookOpen,
    Clock,
    TrendingUp,
    Calendar,
    ArrowRight,
    PlayCircle,
    AlertCircle,
    X,
    Award,
    Sparkles,
    LayoutDashboard,
    ListTodo,
    History,
    LogOut,
    CheckCircle,
    Menu
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({
        totalExams: 0,
        completedExams: 0,
        upcomingExams: 0,
        averageScore: 0
    });
    const [ongoingExams, setOngoingExams] = useState<any[]>([]);
    const [recentHistory, setRecentHistory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State untuk Modal Token
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<any>(null);
    const [tokenInput, setTokenInput] = useState('');
    const [tokenError, setTokenError] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;

            try {
                const [profileRes, examsRes, historyRes] = await Promise.all([
                    api.get('/auth/me'),
                    api.get(`/exams?studentId=${user.id}`),
                    api.get(`/exams/student/${user.id}/history`)
                ]);

                setProfile(profileRes.data);
                const allExams = examsRes.data;
                const history = historyRes.data;

                // 1. Hitung Statistik & History Terakhir
                const completedCount = history.length;

                // Calculate average only from PUBLISHED exams
                const publishedHistory = history.filter((h: any) => h.is_published);
                const totalScore = publishedHistory.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0);
                const avgScore = publishedHistory.length > 0 ? Math.round(totalScore / publishedHistory.length) : 0;

                // Ambil history terakhir (asumsi array terurut atau sort dulu)
                const sortedHistory = [...history].sort((a: any, b: any) => {
                    const dateA = new Date(a.finished_at || a.end_time || 0).getTime();
                    const dateB = new Date(b.finished_at || b.end_time || 0).getTime();
                    return dateB - dateA;
                });
                setRecentHistory(sortedHistory.length > 0 ? sortedHistory[0] : null);

                const now = new Date();

                // 2. Filter Ujian Aktif
                let upcoming = 0;
                const activeMap = new Map();

                allExams.forEach((e: any) => {
                    const start = new Date(e.start_time);
                    const end = new Date(e.end_time);
                    const status = e.student_status;
                    const isTimeActive = now >= start && now <= end;

                    if (status === 'completed') {
                        // Skip
                    } else if (status === 'ongoing') {
                        activeMap.set(e.id, e);
                    } else if (isTimeActive) {
                        if (!activeMap.has(e.id)) {
                            activeMap.set(e.id, e);
                        }
                    } else if (now < start) {
                        upcoming++;
                    }
                });

                setStats({
                    totalExams: allExams.length,
                    completedExams: completedCount,
                    upcomingExams: upcoming,
                    averageScore: avgScore
                });

                setOngoingExams(Array.from(activeMap.values()));

            } catch (error) {
                console.error('Gagal memuat data dashboard', error);
                showToast('Gagal memuat data dashboard', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const handleStartClick = (exam: any) => {
        if (exam.student_status === 'ongoing') {
            navigate(`/exam/${exam.id}`);
        } else {
            setSelectedExam(exam);
            setTokenInput('');
            setTokenError('');
            setIsTokenModalOpen(true);
        }
    };

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    const submitToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tokenInput) return;

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans bg-white md:bg-slate-50 flex flex-col relative overflow-hidden pb-20 md:pb-0 md:overflow-auto">



            {/* ========================================= */}
            {/* UNIFIED RESPONSIVE LAYOUT                 */}
            {/* ========================================= */}
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

                    {/* 1. Desktop Header (Modified for Mobile) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Siswa</h1>
                            <p className="text-slate-500 mt-1 text-sm md:text-base">Selamat datang kembali, <span className="font-bold text-blue-600">{profile?.full_name || user?.username}</span> 👋</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 px-4 w-fit">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hari ini</span>
                                <span className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <ListTodo className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase truncate">Total Ujian</p>
                                <p className="text-xl md:text-2xl font-extrabold text-slate-800">{stats.totalExams}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase truncate">Selesai</p>
                                <p className="text-xl md:text-2xl font-extrabold text-slate-800">{stats.completedExams}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase truncate">Akan Datang</p>
                                <p className="text-xl md:text-2xl font-extrabold text-slate-800">{stats.upcomingExams}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase truncate">Rata-rata</p>
                                <p className="text-xl md:text-2xl font-extrabold text-slate-800">{stats.averageScore}</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Main Content Grid */}
                    <div className="block md:grid md:grid-cols-12 gap-8">
                        {/* Left Col (8) */}
                        <div className="md:col-span-8 space-y-8">

                            {/* Active Exam Section */}
                            <div className="bg-white rounded-3xl shadow-lg shadow-blue-900/5 border border-slate-200 overflow-hidden relative">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 md:px-8 md:py-6 text-white flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-yellow-300" />
                                            Sedang Berlangsung
                                        </h2>
                                        <p className="text-blue-100 text-xs md:text-sm mt-1 opacity-90 hidden sm:block">Jangan lupa kerjakan ujianmu sebelum waktu habis!</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                        <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                    </div>
                                </div>

                                <div className="p-6 md:p-8">
                                    {ongoingExams.length > 0 ? (
                                        <div className="flex flex-col sm:flex-row items-center gap-6">
                                            <div className="w-full sm:w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                                                <div className="text-center">
                                                    <span className="block text-2xl font-extrabold text-blue-600">{ongoingExams[0].duration}</span>
                                                    <span className="text-[10px] font-bold text-blue-400 uppercase">Menit</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 text-center sm:text-left w-full">
                                                <div className="flex justify-center sm:justify-start gap-2 mb-2">
                                                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                                        Wajib
                                                    </span>
                                                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wide">
                                                        {ongoingExams[0].subject}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 line-clamp-2">{ongoingExams[0].title}</h3>
                                                <p className="text-slate-500 text-sm hidden sm:block">Pastikan koneksi internet lancar sebelum memulai.</p>
                                            </div>
                                            <button
                                                onClick={() => handleStartClick(ongoingExams[0])}
                                                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <PlayCircle className="w-5 h-5" />
                                                {ongoingExams[0].student_status === 'ongoing' || ongoingExams[0].student_start_time ? 'Lanjut' : 'Mulai'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                <CheckCircle className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-700">Tidak ada ujian aktif</h3>
                                            <p className="text-slate-500 text-sm">Belum ada ujian yang perlu dikerjakan saat ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent History Table */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-5 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                        <History className="w-5 h-5 text-slate-400" />
                                        Riwayat
                                    </h3>
                                    <button onClick={() => navigate('/student-history')} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                        Lihat Semua
                                    </button>
                                </div>
                                {/* Responsive History List */}
                                <div className="p-0">
                                    {recentHistory ? (
                                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                                    <CheckCircle className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                                            {recentHistory.subject}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(recentHistory.finished_at || recentHistory.end_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 line-clamp-1">{recentHistory.title || recentHistory.exam_title}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5 md:hidden">Selesai dikerjakan</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-4 pl-[4rem] md:pl-0">
                                                <div className="text-left md:text-right">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Nilai Akhir</p>
                                                    {recentHistory.is_published ? (
                                                        <span className={`text-xl font-black ${recentHistory.score >= 75 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                            {recentHistory.score}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-sm italic font-medium">Menunggu</span>
                                                    )}
                                                </div>
                                                <div className="hidden md:block w-px h-10 bg-slate-100 mx-2"></div>
                                                <div className="md:hidden">
                                                    {/* Spacer or mobile specific action if needed */}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                                                <History className="w-6 h-6" />
                                            </div>
                                            <p>Belum ada riwayat ujian.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Right Col (4) */}
                        <div className="md:col-span-4 space-y-6 mt-8 md:mt-0">
                            {/* Quick Menu Widget */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Menu Cepat</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => navigate('/student-exams')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-700 font-bold text-sm transition-colors flex flex-col items-center gap-2">
                                        <ListTodo className="w-6 h-6" />
                                        Jadwal Ujian
                                    </button>
                                    <button onClick={() => navigate('/student-history')} className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-700 font-bold text-sm transition-colors flex flex-col items-center gap-2">
                                        <Award className="w-6 h-6" />
                                        Lihat Nilai
                                    </button>
                                    <button onClick={handleLogoutClick} className="col-span-2 p-3 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-500 font-medium text-sm transition-colors flex items-center justify-center gap-2">
                                        <LogOut className="w-4 h-4" />
                                        Keluar Aplikasi
                                    </button>
                                </div>
                            </div>

                            {/* Motivation Card */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden hidden md:block">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <h3 className="font-bold text-lg mb-2 relative z-10">Tetap Semangat! 🚀</h3>
                                <p className="text-indigo-100 text-sm relative z-10 leading-relaxed">
                                    "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia."
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-indigo-200">
                                    – Nelson Mandela
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOKEN MODAL (Mobile Optimized) */}
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
            {/* LOGOUT CONFIRMATION MODAL */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogOut className="w-8 h-8 ml-1" />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800 mb-2">Ingin Keluar?</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Anda harus login kembali untuk mengakses ujian dan nilai anda nanti.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
