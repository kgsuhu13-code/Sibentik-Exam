import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Calendar, Clock, Trash2, RefreshCw, BookOpen, Loader2 } from 'lucide-react';

import { showConfirm, showSuccess, showError } from '../utils/alert';

interface Exam {
    id: number;
    bank_id: number;
    title: string;
    start_time: string;
    end_time: string;
    duration: number;
    exam_token: string;
    is_active: boolean;
    bank_title?: string;
    subject?: string;
    class_level?: string;
}

interface QuestionBank {
    id: number;
    title: string;
    subject: string;
    class_level: string;
}

const ExamSchedulePage = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        bank_id: '',
        title: '',
        start_time: '',
        end_time: '',
        duration: 60,
        exam_token: ''
    });

    const navigate = useNavigate();

    const fetchExams = async () => {
        try {
            const response = await api.get('/exams');
            setExams(response.data);
        } catch (error) {
            console.error('Gagal mengambil jadwal ujian', error);
        }
    };

    const fetchBanks = async () => {
        try {
            const response = await api.get('/questions/banks');
            setBanks(response.data);
        } catch (error) {
            console.error('Gagal mengambil bank soal', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchExams(), fetchBanks()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = '';
        for (let i = 0; i < 6; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, exam_token: token }));
    };

    const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bankId = parseInt(e.target.value);
        const selectedBank = banks.find(b => b.id === bankId);
        setFormData(prev => ({
            ...prev,
            bank_id: e.target.value,
            title: selectedBank ? selectedBank.title : ''
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/exams', {
                ...formData,
                bank_id: parseInt(formData.bank_id)
            });
            setShowModal(false);
            fetchExams();
            // Reset form
            setFormData({
                bank_id: '',
                title: '',
                start_time: '',
                end_time: '',
                duration: 60,
                exam_token: ''
            });
            await showSuccess('Berhasil!', 'Jadwal ujian berhasil dibuat!');
        } catch (error) {
            console.error('Gagal membuat jadwal', error);
            await showError('Gagal', 'Gagal membuat jadwal ujian');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirm(
            'Hapus Jadwal?',
            "Anda yakin ingin menghapus jadwal ujian ini?",
            'Ya, Hapus!',
            'Batal',
            'warning',
            'danger'
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/exams/${id}`);
                fetchExams();
                await showSuccess('Terhapus!', 'Jadwal ujian berhasil dihapus.');
            } catch (error) {
                console.error('Gagal menghapus', error);
                await showError('Gagal', 'Gagal menghapus jadwal');
            }
        }
    };

    return (
        <div className="space-y-8 font-sans text-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Jadwal Ujian</h1>
                    <p className="text-slate-500 mt-1">Atur jadwal pelaksanaan ujian untuk siswa.</p>
                </div>
                <button
                    onClick={() => {
                        generateToken();
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Buat Jadwal Baru
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Memuat jadwal ujian...</p>
                </div>
            ) : exams.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada Jadwal Ujian</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">Buat jadwal baru untuk memulai pelaksanaan ujian.</p>
                    <button
                        onClick={() => {
                            generateToken();
                            setShowModal(true);
                        }}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Buat Jadwal Baru
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((exam) => (
                        <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={() => handleDelete(exam.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{exam.title}</h3>
                                <p className="text-sm text-slate-500 mb-4">{exam.subject} • Kelas {exam.class_level}</p>

                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                        <span>
                                            {new Date(exam.start_time).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Durasi:</span>
                                        <span className="font-semibold text-slate-700">{exam.duration} Menit</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Token:</span>
                                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-wider">{exam.exam_token}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${new Date() >= new Date(exam.start_time) && new Date() <= new Date(exam.end_time) ? 'bg-green-100 text-green-700' : new Date() > new Date(exam.end_time) ? 'bg-slate-200 text-slate-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {new Date() >= new Date(exam.start_time) && new Date() <= new Date(exam.end_time) ? 'Sedang Berlangsung' : new Date() > new Date(exam.end_time) ? 'Selesai' : 'Akan Datang'}
                                </span>

                                {new Date() >= new Date(exam.start_time) && new Date() <= new Date(exam.end_time) && (
                                    <button
                                        onClick={() => navigate(`/exam-monitor/${exam.id}`)}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                                    >
                                        Monitor Ujian
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                )}

                                {new Date() > new Date(exam.end_time) && (
                                    <button
                                        onClick={() => navigate(`/exam-monitor/${exam.id}`)}
                                        className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 hover:underline"
                                    >
                                        Lihat Hasil
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Create */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-100 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Buat Jadwal Ujian</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Bank Soal</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.bank_id}
                                        onChange={handleBankChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Pilih Paket Soal --</option>
                                        {banks.map(bank => (
                                            <option key={bank.id} value={bank.id}>
                                                {bank.title} ({bank.subject} - Kelas {bank.class_level})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Jadwal Ujian</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                                    placeholder="Contoh: UAS Matematika X IPA 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Mulai</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.start_time}
                                        onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Waktu Selesai</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Durasi (Menit)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Token Ujian</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={formData.exam_token}
                                            readOnly
                                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl font-mono text-center font-bold tracking-widest text-blue-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={generateToken}
                                            className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors"
                                            title="Generate Token Baru"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className={`flex-1 py-2.5 rounded-xl font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 ${creating
                                        ? 'bg-blue-400 text-white cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        'Simpan Jadwal'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamSchedulePage;
