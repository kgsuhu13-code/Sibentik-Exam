
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentSidebar from '../components/StudentSidebar';
import { LayoutDashboard, ListTodo, History, CheckCircle, XCircle, Clock, Menu } from 'lucide-react';

interface HistoryItem {
    exam_id: number;
    exam_title: string;
    subject: string;
    class_level: string;
    end_time: string;
    score: number;
    correct_count: number;
    wrong_count: number;
    total_questions: number;
    is_published: boolean;
}

const StudentHistoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.id) return;
            try {
                const response = await api.get(`/exams/student/${user.id}/history`);
                setHistory(response.data);
            } catch (error) {
                console.error('Gagal mengambil riwayat ujian', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user?.id]);

    // Sort history by date descending
    const sortedHistory = [...history].sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());

    const getGrade = (score: number) => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'E';
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

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

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Riwayat Ujian</h1>
                        <p className="text-slate-500 text-sm mt-1">Daftar pencapaian dan hasil ujian yang telah kamu selesaikan.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">No</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Judul Ujian</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu Selesai</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Detail Nilai</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Skor Akhir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedHistory.length > 0 ? (
                                    sortedHistory.map((item, index) => {
                                        const date = new Date(item.end_time);
                                        const grade = getGrade(item.score);

                                        return (
                                            <tr key={item.exam_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-center text-slate-400 font-medium text-sm">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide rounded-md">
                                                        {item.subject}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700">{item.exam_title}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">{item.class_level}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-300" />
                                                        <span>{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                        <span className="text-slate-300">•</span>
                                                        <span>{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.is_published ? (
                                                        <div className="flex items-center justify-center gap-4 text-xs font-bold">
                                                            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                                <CheckCircle className="w-3.5 h-3.5" /> Benar: {item.correct_count}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-md">
                                                                <XCircle className="w-3.5 h-3.5" /> Salah: {item.wrong_count}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-slate-400 text-xs italic">Detail disembunyikan</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {item.is_published ? (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                                                grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                                                    grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-red-100 text-red-700'
                                                                }`}>
                                                                {grade}
                                                            </span>
                                                            <span className={`text-xl font-extrabold ${item.score >= 75 ? 'text-emerald-600' : 'text-slate-700'
                                                                }`}>
                                                                {item.score}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                            Menunggu
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <History className="w-8 h-8 opacity-20" />
                                                <p>Belum ada riwayat ujian yang ditemukan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden flex flex-col divide-y divide-slate-100">
                        {sortedHistory.length > 0 ? (
                            sortedHistory.map((item) => {
                                const date = new Date(item.end_time);
                                const grade = getGrade(item.score);
                                return (
                                    <div key={item.exam_id} className="p-6 flex flex-col gap-4 bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.score >= 75 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                                    <span className="font-bold text-sm">{getGrade(item.score)}</span>
                                                </div>
                                                <div>
                                                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide rounded-md mb-1">
                                                        {item.subject}
                                                    </span>
                                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-tight">{item.exam_title}</h4>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg w-fit">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Selesai: {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div>
                                                {item.is_published ? (
                                                    <div className="flex items-center gap-3 text-xs font-medium">
                                                        <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> {item.correct_count} Benar</span>
                                                        <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" /> {item.wrong_count} Salah</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Detail disembunyikan</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Nilai Akhir</span>
                                                {item.is_published ? (
                                                    <span className={`text-xl font-black ${item.score >= 75 ? 'text-emerald-600' : 'text-slate-800'}`}>{item.score}</span>
                                                ) : (
                                                    <span className="text-sm font-bold text-amber-500">Menunggu</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <History className="w-10 h-10 opacity-20" />
                                    <p className="text-sm">Belum ada riwayat ujian.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentHistoryPage;
