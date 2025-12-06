import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { History, CheckCircle, XCircle, Clock, Award, Calendar, ListTodo } from 'lucide-react';

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
}

const StudentHistoryPage = () => {
    const { user } = useAuth();
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

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 px-1 md:px-0 relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                    <History className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Riwayat Ujian</h1>
                    <p className="text-slate-500 text-sm">Hasil ujian yang telah diselesaikan.</p>
                </div>
            </div>

            {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item) => {
                        const date = new Date(item.end_time);

                        return (
                            <div key={item.exam_id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all flex flex-col">
                                {/* Card Header */}
                                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-start">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-700">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {date.toLocaleString('id-ID', { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-bold leading-none">
                                            {date.getDate()}
                                        </span>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                        {item.subject}
                                    </span>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1">
                                    <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 line-clamp-2">
                                        {item.exam_title}
                                    </h3>

                                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <span className="text-slate-300">|</span>
                                        <div className="flex items-center gap-1.5">
                                            <ListTodo className="w-3.5 h-3.5" />
                                            <span>{item.total_questions} Soal</span>
                                        </div>
                                    </div>

                                    {/* Score Section */}
                                    <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-1">Nilai Akhir</p>
                                            <p className="text-3xl font-bold text-blue-600">{item.score}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className="flex items-center justify-end gap-1.5 text-xs text-green-600 font-medium">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                <span>{item.correct_count} Benar</span>
                                            </div>
                                            <div className="flex items-center justify-end gap-1.5 text-xs text-red-500 font-medium">
                                                <XCircle className="w-3.5 h-3.5" />
                                                <span>{item.wrong_count} Salah</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <History className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Belum ada riwayat</h3>
                    <p className="text-slate-500 text-sm">Anda belum menyelesaikan ujian apapun.</p>
                </div>
            )}
        </div>
    );
};

export default StudentHistoryPage;
