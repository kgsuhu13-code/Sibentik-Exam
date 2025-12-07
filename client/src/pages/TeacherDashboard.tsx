import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Clock, Calendar, TrendingUp, ArrowRight, Monitor, Edit3, Loader2, CheckCircle, Award, AlertTriangle, BarChart2 } from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
    latestExamAnalysis: {
        exam: {
            id: number;
            title: string;
            subject: string;
            class_level: string;
            end_time: string;
            avg_score: number;
            max_score: number;
            min_score: number;
            remedial_count: number;
            total_participants: number;
        } | null;
        topStudents: { full_name: string; score: number }[];
    };
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

    const { latestExamAnalysis } = data || {};
    const exam = latestExamAnalysis?.exam;
    const topStudents = latestExamAnalysis?.topStudents || [];

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

                    {/* 1. LATEST EXAM ANALYSIS (Success/Review Focus) */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <h2 className="font-bold text-slate-800 text-lg">Analisis Ujian Terakhir</h2>
                            </div>
                        </div>

                        {exam ? (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <BarChart2 className="w-32 h-32 text-blue-600" />
                                </div>

                                <div className="relative z-10">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold text-slate-800">{exam.title}</h3>
                                        <p className="text-slate-500">{exam.subject} • Kelas {exam.class_level} • Selesai {new Date(exam.end_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                            <div className="text-blue-600 font-bold mb-1 flex items-center gap-2">
                                                <BarChart2 className="w-4 h-4" /> Rata-Rata Nilai
                                            </div>
                                            <div className="text-2xl font-bold text-slate-800">{Number(exam.avg_score).toFixed(1)}</div>
                                            <div className="text-xs text-slate-500 mt-1">Dari {exam.total_participants} Siswa</div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                            <div className="text-green-600 font-bold mb-1 flex items-center gap-2">
                                                <Award className="w-4 h-4" /> Nilai Tertinggi
                                            </div>
                                            <div className="text-2xl font-bold text-slate-800">{Number(exam.max_score).toFixed(1)}</div>
                                            <div className="text-xs text-slate-500 mt-1">Sangat Memuaskan</div>
                                        </div>
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                            <div className="text-orange-600 font-bold mb-1 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" /> Perlu Remedial
                                            </div>
                                            <div className="text-2xl font-bold text-slate-800">{exam.remedial_count}</div>
                                            <div className="text-xs text-slate-500 mt-1">Siswa di bawah KKM</div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-yellow-500" /> Top 3 Siswa Terbaik
                                        </h4>
                                        <div className="space-y-2">
                                            {topStudents.map((student, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <span className="font-medium text-slate-700">{student.full_name}</span>
                                                    </div>
                                                    <span className="font-bold text-blue-600">{Number(student.score).toFixed(1)}</span>
                                                </div>
                                            ))}
                                            {topStudents.length === 0 && <p className="text-slate-400 text-sm italic">Belum ada data nilai.</p>}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => navigate(`/exam-monitor/${exam.id}`)}
                                            className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1"
                                        >
                                            Lihat Analisis Detail <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <BarChart2 className="w-6 h-6" />
                                </div>
                                <p className="text-slate-500 font-medium">Belum ada ujian yang selesai untuk dianalisis.</p>
                                <button onClick={() => navigate('/exam-schedule')} className="text-blue-600 text-sm font-bold mt-2 hover:underline">
                                    Buat Jadwal Ujian
                                </button>
                            </div>
                        )}
                    </section>

                    {/* 2. RECENT PERFORMANCE (History Table) */}
                    <section>
                        <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-500" />
                            Riwayat Ujian
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

                    {/* 3. ACTIVE EXAMS (Live Now) */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Ujian Berlangsung
                        </h2>

                        <div className="space-y-4">
                            {data?.activeExams && data.activeExams.length > 0 ? (
                                data.activeExams.map((exam: any) => (
                                    <div key={exam.id} className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                        <div className="flex-shrink-0 w-12 text-center bg-green-50 rounded-lg py-2">
                                            <Monitor className="w-6 h-6 text-green-600 mx-auto" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{exam.title}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-1">
                                                Kelas {exam.class_level} • {exam.submitted_count} Selesai
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                                                    Token: <span className="font-bold select-all text-blue-600">{exam.exam_token}</span>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/exam-monitor/${exam.id}`)}
                                                    className="text-[10px] font-bold text-blue-600 hover:underline"
                                                >
                                                    Pantau
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-slate-500 italic">Tidak ada ujian yang sedang aktif saat ini.</p>
                                    <button onClick={() => navigate('/exam-schedule')} className="text-xs text-blue-600 font-bold mt-2 hover:underline">
                                        + Jadwalkan Ujian
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 4. GRADING QUEUE */}
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
                                            onClick={() => navigate(`/exam-monitor/${item.id}`)}
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
