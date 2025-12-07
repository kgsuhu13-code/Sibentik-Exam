import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Trash2, Edit, BookOpen, FileText, Calendar, Copy, Loader2, Globe, Lock, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showConfirm, showSuccess, showError } from '../utils/alert';

interface QuestionBank {
    id: number;
    title: string;
    description?: string;
    subject: string;
    class_level: string;
    total_questions: number;
    mc_count: number;
    essay_count: number;
    author_name: string;
    created_at: string;
    created_by: number;
    is_random_question: boolean;
    is_random_answer: boolean;
    is_public: boolean;
    school_name?: string;
}

const QuestionBankPage = () => {
    const { user } = useAuth();
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterSchool, setFilterSchool] = useState('');

    // TAB STATE: 'private' | 'public'
    const [activeTab, setActiveTab] = useState<'private' | 'public'>('private');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject: '',
        class_level: '',
        is_public: false
    });

    const navigate = useNavigate();

    const fetchBanks = async () => {
        setLoading(true);
        try {
            // Include scope in query
            const response = await api.get(`/questions/banks?scope=${activeTab}`);
            setBanks(response.data);
        } catch (error) {
            console.error('Gagal mengambil data bank soal', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
        fetchClasses();
    }, [activeTab]); // Refetch when tab changes

    const fetchClasses = async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        }
    };

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
                description: '',
                subject: '',
                class_level: '',
                is_public: false
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
                // If in public tab, duplicating makes a private copy, so we might want to switch tab? 
                // For now, just show success. 
                await showSuccess('Berhasil!', 'Bank soal berhasil diduplikasi ke koleksi pribadi Anda!');
                if (activeTab === 'private') {
                    fetchBanks();
                } else {
                    // Optionally switch tab
                    setActiveTab('private');
                }
            } catch (error) {
                console.error('Gagal menduplikasi', error);
                await showError('Gagal', 'Gagal menduplikasi bank soal');
            }
        }
    };

    const uniqueSubjects = Array.from(new Set(banks.map(b => b.subject))).sort();
    const uniqueSchools = Array.from(new Set(banks.map(b => b.school_name).filter(Boolean))).sort();

    const filteredBanks = banks.filter(bank => {
        const matchSearch = bank.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchClass = filterClass ? bank.class_level === filterClass : true;
        const matchSubject = filterSubject ? bank.subject === filterSubject : true;
        const matchSchool = filterSchool ? bank.school_name === filterSchool : true;
        return matchSearch && matchClass && matchSubject && matchSchool;
    });

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

            {/* TABS Navigation */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('private')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'private'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Lock className="w-4 h-4" />
                        Pribadi (Milik Saya)
                    </button>
                    <button
                        onClick={() => setActiveTab('public')}
                        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'public'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        Publik (Berbagi)
                    </button>
                </nav>
            </div>

            {/* Search & Filter Bar */}
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-6 relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cari judul bank soal..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                    />
                </div>
                <div className="md:col-span-3">
                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Semua Mapel</option>
                        {uniqueSubjects.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-3">
                    <div className="flex gap-2">
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map((cls) => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </select>
                        {/* School Filter - Only on Public Tab */}
                        {activeTab === 'public' && (
                            <select
                                value={filterSchool}
                                onChange={(e) => setFilterSchool(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Semua Sekolah</option>
                                {uniqueSchools.map((sch) => (
                                    <option key={sch as string} value={sch as string}>{sch}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-500 font-medium">Memuat data bank soal...</p>
                </div>

            ) : filteredBanks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    {banks.length === 0 ? (
                        <>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">
                                {activeTab === 'private' ? 'Belum ada Bank Soal Pribadi' : 'Belum ada Bank Soal Publik'}
                            </h3>
                            <p className="text-slate-500 mb-6 max-w-md mx-auto">
                                {activeTab === 'private'
                                    ? 'Mulai buat koleksi soal Anda sendiri.'
                                    : 'Belum ada bank soal yang dibagikan ke publik.'}
                            </p>
                            {activeTab === 'private' && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="text-blue-600 font-semibold hover:underline"
                                >
                                    Buat Bank Soal Baru
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Tidak Ditemukan</h3>
                            <p className="text-slate-500 mb-4">
                                Tidak ada bank soal yang cocok dengan pencarian Anda.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterClass('');
                                    setFilterSubject('');
                                    setFilterSchool('');
                                }}
                                className="text-blue-600 font-semibold hover:underline"
                            >
                                Reset Filter
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBanks.map((bank) => {
                        const isOwner = user?.id === bank.created_by;
                        return (
                            <div key={bank.id} className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col overflow-hidden relative">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                            <BookOpen className="w-6 h-6" />
                                        </div>

                                        <div className="flex items-center gap-2 z-20">
                                            {/* Badge Public/Private inside flow to prevent overlap */}
                                            {activeTab === 'private' && bank.is_public && (
                                                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <Globe className="w-3 h-3" /> Publik
                                                </div>
                                            )}

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
                                                    <>
                                                        <button
                                                            onClick={() => navigate(`/question-bank/${bank.id}/preview`)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Lihat Preview"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDuplicate(bank.id)}
                                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Duplikat ke Koleksi Saya"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1" title={bank.title}>
                                        {bank.title}
                                    </h3>

                                    {/* DESCRIPTION PREVIEW */}
                                    <p className="text-sm text-slate-500 mb-3 line-clamp-2 min-h-[40px]">
                                        {bank.description || <span className="italic text-slate-400">Tidak ada deskripsi.</span>}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            {bank.subject}
                                        </span>
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                            Kelas {bank.class_level}
                                        </span>
                                    </div>

                                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {/* TOTAL */}
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center text-slate-500">
                                                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                                                <span>Total Soal</span>
                                            </div>
                                            <span className="font-bold text-slate-700">{bank.total_questions}</span>
                                        </div>

                                        {/* DETAIL COUNTS */}
                                        <div className="flex justify-between items-center text-xs text-slate-400 pl-6">
                                            <span>PG (Pilihan Ganda)</span>
                                            <span className="font-medium text-slate-600">{bank.mc_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-400 pl-6">
                                            <span>Essay (Uraian)</span>
                                            <span className="font-medium text-slate-600">{bank.essay_count || 0}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center text-xs text-slate-400">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        <span>{new Date(bank.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                {bank.author_name ? bank.author_name.charAt(0) : 'A'}
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">
                                                {bank.author_name || 'Admin'}
                                            </span>
                                        </div>
                                        {bank.school_name && activeTab === 'public' && (
                                            <span className="text-[10px] text-slate-400 ml-8 truncate max-w-[120px]">
                                                {bank.school_name}
                                            </span>
                                        )}
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
            )
            }

            {/* Modern Modal */}
            {
                showModal && (
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

                                {/* DESCRIPTION FIELD */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Singkat</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all resize-none"
                                        rows={3}
                                        placeholder="Jelaskan isi soal, misal: Fokus pada Bab Ekosistem..."
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
                                            {classes.length > 0 ? (
                                                classes.map((cls) => (
                                                    <option key={cls} value={cls}>{cls}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="X">Kelas X</option>
                                                    <option value="XI">Kelas XI</option>
                                                    <option value="XII">Kelas XII</option>
                                                </>
                                            )}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Public/Private Toggle */}
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-blue-500" />
                                            Set sebagai Publik?
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Jika aktif, bank soal ini bisa dilihat dan diduplikat oleh guru lain dari sekolah manapun.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.is_public}
                                            onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
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
                )
            }
        </div >
    );
};

export default QuestionBankPage;
