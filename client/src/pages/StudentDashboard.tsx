import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {

    BookOpen,
    CheckCircle,
    Clock,
    TrendingUp,
    Calendar,
    ArrowRight,
    PlayCircle,
    AlertCircle,
    Hourglass,
    X,
    KeyRound,
    LogOut,
    Loader2
} from 'lucide-react';
import { showConfirm, showSuccess } from '../utils/alert';

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

                // 1. Hitung Statistik
                const completedCount = history.length;
                const totalScore = history.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0);
                const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;

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
    }, [user, showToast]);

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

    const handleLogoutClick = async () => {
        const result = await showConfirm(
            'Ingin Keluar?',
            "Anda harus login kembali untuk mengakses akun ini.",
            'Ya, Keluar',
            'Batal',
            'warning',
            'danger'
        );

        if (result.isConfirmed) {
            logout();
            navigate('/login');
            await showSuccess('Berhasil', 'Berhasil keluar');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans pb-24 px-1 md:px-0 relative">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-100 shrink-0 border-2 border-white ring-2 ring-blue-50">
                    {profile?.full_name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                        {profile?.full_name || user?.username}
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] md:text-xs font-bold rounded-full border border-slate-200 uppercase tracking-wide">
                            {profile?.class_level ? `Kelas ${profile.class_level}` : 'Siswa'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogoutClick}
                    className="md:hidden p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Keluar"
                >
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            {/* SECTION: UJIAN SEDANG BERLANGSUNG */}
            {ongoingExams.length > 0 && (
                <div className="animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            <h2 className="text-base font-bold text-slate-800">Sedang Berlangsung</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {ongoingExams.map((exam) => {
                            const isExpired = new Date() > new Date(exam.end_time);

                            return (
                                <div key={exam.id} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex flex-col gap-3 relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isExpired ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                                    <div className="flex justify-between items-start pl-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1 inline-block">
                                                {exam.subject}
                                            </span>
                                            <h3 className="text-base font-bold text-slate-800 leading-tight mb-1">{exam.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {exam.duration}m
                                                </span>
                                                <span className={`flex items-center gap-1 font-medium ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                                    <Hourglass className="w-3 h-3" />
                                                    {isExpired ? 'Waktu Habis' : `Berakhir: ${new Date(exam.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleStartClick(exam)}
                                        className={`w-full py-2.5 text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 pl-2 ${isExpired
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : exam.student_status === 'ongoing'
                                                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {isExpired ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" /> Kumpulkan Sekarang
                                            </>
                                        ) : exam.student_status === 'ongoing' ? (
                                            <>
                                                <PlayCircle className="w-4 h-4" /> Lanjutkan Ujian
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle className="w-4 h-4" /> Kerjakan Sekarang
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div>
                <h2 className="text-base font-bold text-slate-800 mb-3 px-1">Statistik Kamu</h2>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mb-2">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800 leading-none">{stats.totalExams}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Ujian</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg mb-2">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800 leading-none">{stats.completedExams}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Selesai</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mb-2">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800 leading-none">{stats.upcomingExams}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mendatang</span>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mb-2">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold text-slate-800 leading-none">{stats.averageScore}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Rata-rata</span>
                    </div>
                </div>
            </div>

            {/* Quick Menu */}
            <div className="grid grid-cols-1 gap-3">
                <div
                    onClick={() => navigate('/student-exams')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between active:bg-slate-50 cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Jadwal Ujian</h3>
                            <p className="text-xs text-slate-500">Lihat semua daftar ujian</p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>

                <div
                    onClick={() => navigate('/student-history')}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between active:bg-slate-50 cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Riwayat Hasil</h3>
                            <p className="text-xs text-slate-500">Cek nilai ujianmu</p>
                        </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
            </div>

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

export default StudentDashboard;
