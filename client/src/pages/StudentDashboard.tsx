
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
    BookOpen,
    Clock,
    TrendingUp,
    Calendar,
    ArrowRight,
    PlayCircle,
    AlertCircle,
    X,
    KeyRound,
    Loader2,
    Award,
    Sparkles,
    LayoutDashboard,
    ListTodo,
    History,
    LogOut
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
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

    // ... existing token modal state ...

    // ... existing useEffect ...

    // ... existing handleStartClick ...

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
        <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden pb-20">

            {/* --- TOP SECTION (WHITE ~20%) --- */}
            <div className="px-6 pt-8 pb-12 bg-white relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 p-0.5 shadow-sm shrink-0">
                            <div className="w-full h-full bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                {profile?.full_name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium mb-0.5">Selamat Datang,</p>
                            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">
                                {profile?.full_name?.split(' ')[0] || user?.username} 👋
                            </h1>
                        </div>
                    </div>
                    {/* Logout Button */}
                    <button
                        onClick={handleLogoutClick}
                        className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                    >
                        <LogOut className="w-5 h-5 ml-0.5" />
                    </button>
                </div>

                {/* Score Summary Bubble */}
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm w-full">
                        <div className={`p-2 rounded-xl ${stats.averageScore >= 80 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rata-rata Nilai</p>
                            <p className="text-lg font-extrabold text-slate-800">{stats.averageScore}</p>
                        </div>
                        <div className="ml-auto">
                            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                {stats.completedExams} Selesai
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM SECTION (BLUE GRADIENT ~80%) --- */}
            <div className="flex-1 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(37,99,235,0.2)] relative z-0 px-6 pt-8 pb-24 -mt-6">

                {/* Decoration Circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="relative z-10 space-y-6">

                    {/* 1. ONGOING EXAM CARD (Featured) */}
                    {ongoingExams.length > 0 ? (
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-white relative overflow-hidden group">
                            <div className="absolute top-4 right-4 animate-pulse">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            </div>

                            <div className="mb-4">
                                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-blue-50 mb-2">
                                    Sedang Berlangsung
                                </span>
                                <h2 className="text-xl font-bold leading-tight mb-1">{ongoingExams[0].title}</h2>
                                <p className="text-blue-100 text-sm">{ongoingExams[0].subject}</p>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-medium text-blue-100 mb-5 bg-black/10 p-2 rounded-xl w-fit">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> {ongoingExams[0].duration} Menit
                                </span>
                            </div>

                            <button
                                onClick={() => handleStartClick(ongoingExams[0])}
                                className="w-full bg-white text-blue-700 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <PlayCircle className="w-5 h-5 fill-current" />
                                Kerjakan Sekarang
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl text-white text-center py-8">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-300">
                                <Sparkles className="w-8 h-8 fill-current" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">Tidak Ada Ujian Aktif</h3>
                            <p className="text-blue-100 text-sm">Istirahatlah sejenak, kamu hebat!</p>
                        </div>
                    )}

                    {/* 2. RECENT HISTORY (WIDGET) */}
                    {recentHistory && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 rounded-xl flex items-center justify-center text-lg font-bold border border-emerald-500/30">
                                {recentHistory.is_published ? recentHistory.score : <Clock className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-blue-200 text-xs mb-0.5">
                                    Selesai: {(() => {
                                        const d = new Date(recentHistory.finished_at || recentHistory.end_time || Date.now());
                                        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                    })()}
                                </p>
                                <h4 className="text-white font-bold text-sm truncate">{recentHistory.title || 'Ujian Sebelumnya'}</h4>
                            </div>
                            <button onClick={() => navigate('/student-history')} className="p-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 hover:text-white">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* 3. MAIN MENU GRID */}
                    <div>
                        <h3 className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-4 pl-1 flex items-center gap-2">
                            Menu Utama <div className="h-px bg-blue-400/30 flex-1"></div>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/student-exams')}
                                className="bg-white p-5 rounded-3xl shadow-lg border border-white/50 flex flex-col items-center text-center gap-3 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="block text-slate-800 font-bold text-sm">Jadwal</span>
                                    <span className="block text-slate-400 text-xs mt-0.5">{stats.upcomingExams} Ujian</span>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/student-history')}
                                className="bg-white p-5 rounded-3xl shadow-lg border border-white/50 flex flex-col items-center text-center gap-3 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="block text-slate-800 font-bold text-sm">Nilai</span>
                                    <span className="block text-slate-400 text-xs mt-0.5">Riwayat</span>
                                </div>
                            </button>

                            {/* Featured Placeholder 1 */}
                            <button
                                className="bg-white/5 p-5 rounded-3xl border border-white/10 flex flex-col items-center text-center gap-3 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="block text-white font-bold text-sm">Materi</span>
                                    <span className="block text-blue-200 text-xs mt-0.5">Segera</span>
                                </div>
                            </button>

                            {/* Featured Placeholder 2 */}
                            <button
                                className="bg-white/5 p-5 rounded-3xl border border-white/10 flex flex-col items-center text-center gap-3 active:scale-95 transition-all"
                            >
                                <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <span className="block text-white font-bold text-sm">Analisis</span>
                                    <span className="block text-blue-200 text-xs mt-0.5">Segera</span>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    <button
                        onClick={() => navigate('/student-dashboard')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-blue-600`}
                    >
                        <LayoutDashboard className="w-6 h-6 fill-current" strokeWidth={2.5} />
                        <span className="text-[10px] font-medium">Dashboard</span>
                    </button>

                    <button
                        onClick={() => navigate('/student-exams')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600`}
                    >
                        <ListTodo className="w-6 h-6" strokeWidth={2} />
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
