import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Activity,
    Users,
    AlertTriangle,
    Clock,
    ArrowRight,
    MonitorPlay
} from 'lucide-react';

interface Exam {
    id: number;
    title: string;
    subject: string;
    class_level: string;
    start_time: string;
    end_time: string;
    duration: number;
    is_active: boolean;
}

interface ExamStats {
    total_students: number;
    active_students: number; // Yang sedang mengerjakan
    finished_students: number;
    violation_count: number;
}

const MonitoringDashboardPage = () => {
    const navigate = useNavigate();
    const [activeExams, setActiveExams] = useState<Exam[]>([]);
    const [stats, setStats] = useState<Record<number, ExamStats>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActiveExams = async () => {
            try {
                // 1. Ambil semua ujian (scope=all untuk melihat ujian guru lain juga)
                const response = await api.get('/exams?scope=all');
                const allExams: Exam[] = response.data;

                // 2. Filter hanya yang sedang berlangsung (berdasarkan waktu)
                const now = new Date();
                const currentExams = allExams.filter(exam => {
                    const start = new Date(exam.start_time);
                    const end = new Date(exam.end_time);
                    return now >= start && now <= end;
                });

                setActiveExams(currentExams);

                // 3. Ambil statistik ringkas untuk setiap ujian aktif (Optional: bisa di-skip jika berat)
                // Kita coba fetch data monitoring ringkas untuk setiap ujian aktif
                const statsMap: Record<number, ExamStats> = {};

                await Promise.all(currentExams.map(async (exam) => {
                    try {
                        const monitorRes = await api.get(`/exams/${exam.id}/monitor`);
                        // FIX: Response API adalah object { students: [...] }, bukan array langsung
                        const students = monitorRes.data.students || [];

                        // Hitung statistik sederhana dari data siswa
                        const total = students.length;
                        const active = students.filter((s: any) => s.status === 'ongoing').length;
                        const finished = students.filter((s: any) => s.status === 'completed').length;
                        const violations = students.filter((s: any) => (s.violation_count || 0) > 0).length;

                        statsMap[exam.id] = {
                            total_students: total,
                            active_students: active,
                            finished_students: finished,
                            violation_count: violations
                        };
                    } catch (err) {
                        console.error(`Gagal fetch stats ujian ${exam.id}`, err);
                    }
                }));

                setStats(statsMap);

            } catch (error) {
                console.error('Gagal memuat data monitoring', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveExams();

        // Refresh setiap 30 detik
        const interval = setInterval(fetchActiveExams, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Live Monitoring</h1>
                        <p className="text-slate-500 text-sm">Pantau ujian yang sedang berlangsung secara real-time.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    LIVE UPDATE
                </div>
            </div>

            {/* Active Exams Grid */}
            {activeExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeExams.map((exam) => {
                        const examStats = stats[exam.id] || { total_students: 0, active_students: 0, finished_students: 0, violation_count: 0 };

                        return (
                            <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                                {/* Header Card */}
                                <div className="p-5 border-b border-slate-50 flex justify-between items-start bg-gradient-to-r from-white to-slate-50">
                                    <div>
                                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-2 inline-block uppercase tracking-wider">
                                            {exam.subject}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{exam.title}</h3>
                                        <p className="text-xs text-slate-500">Kelas {exam.class_level}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                        <MonitorPlay className="w-5 h-5" />
                                    </div>
                                </div>

                                {/* Stats Body */}
                                <div className="p-5 flex-1 space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Sisa Waktu
                                        </span>
                                        <span className="font-bold text-slate-700">
                                            {/* Hitung sisa waktu relatif terhadap jam sekarang (kasar) */}
                                            {(() => {
                                                const end = new Date(exam.end_time);
                                                const now = new Date();
                                                const diff = end.getTime() - now.getTime();
                                                const minutes = Math.floor(diff / 60000);
                                                return minutes > 0 ? `${minutes} Menit` : 'Hampir Selesai';
                                            })()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                                                <Users className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase">Online</span>
                                            </div>
                                            <span className="text-xl font-bold text-slate-800">
                                                {examStats.active_students}
                                                <span className="text-xs text-slate-400 font-normal ml-1">/ {examStats.total_students}</span>
                                            </span>
                                        </div>

                                        <div className={`p-3 rounded-xl border ${examStats.violation_count > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className={`flex items-center gap-1.5 mb-1 ${examStats.violation_count > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase">Pelanggaran</span>
                                            </div>
                                            <span className={`text-xl font-bold ${examStats.violation_count > 0 ? 'text-red-700' : 'text-slate-700'}`}>
                                                {examStats.violation_count}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                                    <button
                                        onClick={() => navigate(`/exam-monitor/${exam.id}`)}
                                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        Pantau Detail <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <MonitorPlay className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Tidak Ada Ujian Aktif</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Saat ini tidak ada ujian yang sedang berlangsung. Ujian akan muncul di sini secara otomatis saat waktunya tiba.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MonitoringDashboardPage;
