import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, Calendar, TrendingUp, ArrowRight, Monitor, Edit3, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
    activeExams: any[];
    upcomingExams: any[];
    gradingQueue: any[];
    recentPerformance: any[];
    stats: {
        total_students: number;
        total_banks: number;
    };
}

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/dashboard/teacher');
                setData(response.data);
            } catch (error) {
                console.error('Gagal mengambil data dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans text-slate-900 pb-10">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard Operasional</h1>
                    <p className="text-slate-500 mt-1">Pantau aktivitas ujian dan tugas prioritas Anda.</p>
                </div>
                <div className="flex gap-4 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>{data?.stats.total_students} Siswa</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>{data?.stats.total_banks} Bank Soal</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN (2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 1. LIVE MONITORING (Highlight) */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <h2 className="font-bold text-slate-800 text-lg">Sedang Berlangsung</h2>
                        </div>

                        {data?.activeExams && data.activeExams.length > 0 ? (
                            <div className="grid gap-4">
                                {data.activeExams.map((exam: any) => {
                                    // Fix: Parse ke Number dan handle pembagian dengan nol
                                    const submitted = Number(exam.submitted_count) || 0;
                                    const total = Number(exam.total_students) || 0;
                                    const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;

                                    return (
                                        <div key={exam.id} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:border-blue-300 transition-all relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">{exam.title}</h3>
                                                    <p className="text-slate-500 text-sm">{exam.subject} • Kelas {exam.class_level}</p>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/exam-monitor/${exam.id}`)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-blue-200 shadow-lg"
                                                >
                                                    <Monitor className="w-4 h-4" />
                                                    Pantau Live
                                                </button>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span className="text-slate-600">Progress Submit</span>
                                                    <span className="text-blue-600">{submitted} / {total} Siswa ({progress}%)</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                Selesai pukul {new Date(exam.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <p className="text-slate-500 font-medium">Tidak ada ujian yang sedang berlangsung saat ini.</p>
                                <button onClick={() => navigate('/exam-schedule')} className="text-blue-600 text-sm font-bold mt-2 hover:underline">
                                    Lihat Jadwal Lengkap
                                </button>
                            </div>
                        )}
                    </section>

                    {/* 2. RECENT PERFORMANCE */}
                    <section>
                        <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-500" />
                            Hasil Ujian Terakhir
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">Nama Ujian</th>
                                        <th className="px-6 py-3">Kelas</th>
                                        <th className="px-6 py-3 text-center">Rata-rata</th>
                                        <th className="px-6 py-3 text-center">Partisipan</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data?.recentPerformance && data.recentPerformance.length > 0 ? (
                                        data.recentPerformance.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-800">{item.title}</td>
                                                <td className="px-6 py-4 text-slate-500">{item.class_level}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${Number(item.avg_score) >= 75 ? 'bg-green-100 text-green-700' :
                                                        Number(item.avg_score) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        {Number(item.avg_score).toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-slate-600">{item.participant_count}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Detail</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">Belum ada data hasil ujian.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN (1/3) */}
                <div className="space-y-8">

                    {/* 3. UPCOMING SCHEDULE */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            Jadwal Terdekat
                        </h2>

                        <div className="space-y-4">
                            {data?.upcomingExams && data.upcomingExams.length > 0 ? (
                                data.upcomingExams.map((exam: any) => (
                                    <div key={exam.id} className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                        <div className="flex-shrink-0 w-12 text-center bg-indigo-50 rounded-lg py-1">
                                            <span className="block text-xs font-bold text-indigo-600 uppercase">
                                                {new Date(exam.start_time).toLocaleDateString('id-ID', { month: 'short' })}
                                            </span>
                                            <span className="block text-lg font-bold text-indigo-700 leading-none">
                                                {new Date(exam.start_time).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{exam.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-1">
                                                {new Date(exam.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {exam.class_level}
                                            </p>
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                                                Token: <span className="font-bold select-all">{exam.exam_token}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic">Tidak ada jadwal ujian dalam 48 jam ke depan.</p>
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/exam-schedule')}
                            className="w-full mt-4 py-2 text-sm text-indigo-600 font-bold hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            Lihat Semua Jadwal <ArrowRight className="w-4 h-4" />
                        </button>
                    </section>

                    {/* 4. GRADING QUEUE (TO DO) */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Edit3 className="w-5 h-5 text-orange-500" />
                            Perlu Dikoreksi
                        </h2>

                        <div className="space-y-3">
                            {data?.gradingQueue && data.gradingQueue.length > 0 ? (
                                data.gradingQueue.map((item: any) => (
                                    <div key={item.id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                                            <p className="text-xs text-orange-700 mt-0.5">{item.submission_count} Jawaban Masuk</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/exam-schedule`)} // Idealnya ke halaman list siswa per ujian untuk grading
                                            className="p-2 bg-white text-orange-600 rounded-md shadow-sm hover:bg-orange-100 transition-colors"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm text-slate-600 font-medium">Semua aman!</p>
                                    <p className="text-xs text-slate-400">Tidak ada antrean koreksi saat ini.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Quick Actions (Compact) */}
                    <section className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/question-bank')}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all text-left group"
                        >
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 block">Bank Soal</span>
                        </button>
                        <button
                            onClick={() => navigate('/students')}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all text-left group"
                        >
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Users className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 block">Data Siswa</span>
                        </button>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
