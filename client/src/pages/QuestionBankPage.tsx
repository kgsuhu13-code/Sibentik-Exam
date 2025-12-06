import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Edit, BookOpen, FileText, Calendar, Copy, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { showConfirm, showSuccess, showError } from '../utils/alert';

interface QuestionBank {
    id: number;
    title: string;
    subject: string;
    class_level: string;
    total_questions: number;
    author_name: string;
    created_at: string;
    created_by: number;
    is_random_question: boolean;
    is_random_answer: boolean;
}

const QuestionBankPage = () => {
    const { user } = useAuth();
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subject: '',
        class_level: ''
    });

    const navigate = useNavigate();

    const fetchBanks = async () => {
        try {
            const response = await api.get('/questions/banks');
            setBanks(response.data);
        } catch (error) {
            console.error('Gagal mengambil data bank soal', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/questions/banks', {
                ...formData,
                created_by: user?.id
            });
            setShowModal(false);
            setFormData({
                title: '',
                subject: '',
                class_level: ''
            });
            fetchBanks();
            await showSuccess('Berhasil!', 'Bank soal berhasil dibuat!');
        } catch (error) {
            console.error('Gagal membuat bank soal', error);
            await showError('Gagal', 'Gagal membuat bank soal');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await showConfirm(
            'Hapus Bank Soal?',
            "Anda yakin ingin menghapus bank soal ini? Tindakan ini tidak dapat dibatalkan.",
            'Ya, Hapus!',
            'Batal',
            'warning',
            'danger'
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/questions/banks/${id}`);
                fetchBanks();
                await showSuccess('Terhapus!', 'Bank soal berhasil dihapus.');
            } catch (error) {
                console.error('Gagal menghapus', error);
                await showError('Gagal', 'Gagal menghapus bank soal (Mungkin Anda bukan pemiliknya)');
            }
        }
    };

    const handleDuplicate = async (id: number) => {
        const result = await showConfirm(
            'Duplikat Bank Soal?',
            "Anda akan menjadi pemilik salinan bank soal ini.",
            'Ya, Duplikat',
            'Batal',
            'question',
            'primary'
        );

        if (result.isConfirmed) {
            try {
                await api.post(`/questions/banks/${id}/duplicate`);
                fetchBanks();
                await showSuccess('Berhasil!', 'Bank soal berhasil diduplikasi!');
            } catch (error) {
                console.error('Gagal menduplikasi', error);
                await showError('Gagal', 'Gagal menduplikasi bank soal');
            }
        }
    };

    return (
        <div className="space-y-8 font-sans text-slate-900">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bank Soal</h1>
                    <p className="text-slate-500 mt-1">Kelola dan atur paket soal ujian Anda dengan mudah.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Buat Bank Soal
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari judul bank soal atau mata pelajaran..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                </div>
                <div className="w-full md:w-48">
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer">
                        <option>Semua Kelas</option>
                        <option>Kelas X</option>
                        <option>Kelas XI</option>
                        <option>Kelas XII</option>
                    </select>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Memuat data bank soal...</p>
                </div>
            ) : banks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Belum ada Bank Soal</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">Mulai buat koleksi soal Anda untuk digunakan dalam ujian siswa.</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Buat Bank Soal Baru
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banks.map((bank) => {
                        const isOwner = user?.id === bank.created_by;
                        return (
                            <div key={bank.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col overflow-hidden">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-1">
                                            {isOwner ? (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/question-bank/${bank.id}`)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(bank.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleDuplicate(bank.id)}
                                                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Duplikat (Salin)"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1" title={bank.title}>
                                        {bank.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            {bank.subject}
                                        </span>
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            Kelas {bank.class_level}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-slate-500">
                                            <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                            <span>{bank.total_questions} Butir Soal</span>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-500">
                                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                            <span>{new Date(bank.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                            {bank.author_name ? bank.author_name.charAt(0) : 'A'}
                                        </div>
                                        <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">
                                            {bank.author_name || 'Admin'}
                                        </span>
                                    </div>
                                    {isOwner ? (
                                        <button
                                            onClick={() => navigate(`/question-bank/${bank.id}`)}
                                            className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                        >
                                            Kelola Soal
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">View Only</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Buat Bank Soal Baru</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Judul Paket Soal</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                                    placeholder="Contoh: UAS Matematika 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mata Pelajaran</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                                    placeholder="Contoh: Matematika Wajib"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tingkat Kelas</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.class_level}
                                        onChange={e => setFormData({ ...formData, class_level: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Pilih Kelas...</option>
                                        <option value="X">Kelas X</option>
                                        <option value="XI">Kelas XI</option>
                                        <option value="XII">Kelas XII</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" /></svg>
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
                                        'Buat Sekarang'
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

export default QuestionBankPage;
