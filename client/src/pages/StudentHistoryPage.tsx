
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LayoutDashboard, ListTodo, History, CheckCircle, XCircle, Clock } from 'lucide-react';

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
        <div className="min-h-screen bg-white font-sans flex flex-col relative overflow-hidden pb-20">

            {/* --- TOP SECTION --- */}
            <div className="px-6 pt-10 pb-8 bg-white z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                        <History className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                            Riwayat Ujian
                        </h1>
                        <p className="text-slate-500 text-xs font-medium mt-0.5">Daftar pencapaian hasil ujianmu.</p>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM SECTION (BLUE GRADIENT) --- */}
            <div className="flex-1 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(37,99,235,0.2)] relative z-0 pt-8 pb-24 -mt-4 overflow-hidden">

                {/* Decoration Circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="relative z-10 px-4 md:px-6 h-full overflow-y-auto pb-20">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[300px] md:min-w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="p-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell w-12 text-center">No</th>
                                        <th className="p-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</th>
                                        <th className="p-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Nilai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedHistory.length > 0 ? (
                                        sortedHistory.map((item, index) => {
                                            const date = new Date(item.end_time);
                                            return (
                                                <tr key={item.exam_id} className="hover:bg-blue-50/50 transition-colors group">
                                                    <td className="p-4 text-slate-400 font-medium text-xs hidden md:table-cell text-center">
                                                        {index + 1}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md w-fit">
                                                                    {item.subject}
                                                                </span>
                                                                <span className="md:hidden text-[10px] text-slate-400">
                                                                    {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs md:text-sm font-bold text-slate-700 line-clamp-2 leading-tight">
                                                                {item.exam_title}
                                                            </p>
                                                            <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {item.is_published ? (
                                                            <div className="flex items-center justify-center gap-3">
                                                                <div className="flex flex-col items-end gap-0.5">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${item.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                        Grade {getGrade(item.score)}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                                                        <span className="text-green-600 flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> {item.correct_count}</span>
                                                                        <span className="text-red-500 flex items-center gap-0.5"><XCircle className="w-3 h-3" /> {item.wrong_count}</span>
                                                                    </div>
                                                                </div>

                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.score >= 75 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                                    <span className="text-lg font-black">{item.score}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center gap-1">
                                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                                    Menunggu
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">Nilai diproses</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-slate-400 text-sm">
                                                Belum ada riwayat ujian.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600`}
                    >
                        <ListTodo className="w-6 h-6" strokeWidth={2} />
                        <span className="text-[10px] font-medium">Ujian</span>
                    </button>

                    <button
                        onClick={() => navigate('/student-history')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 text-blue-600`}
                    >
                        <History className="w-6 h-6" strokeWidth={2.5} />
                        <span className="text-[10px] font-medium">Riwayat</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentHistoryPage;
