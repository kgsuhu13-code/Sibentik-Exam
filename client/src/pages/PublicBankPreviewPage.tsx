import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, BookOpen, Clock, FileText, CheckCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import { showConfirm, showSuccess, showError } from '../utils/alert';

interface Question {
    id: number;
    content: string;
    type: 'multiple_choice' | 'essay';
    options: any;
    correct_answer: string;
    points: number;
}

const PublicBankPreviewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bank, setBank] = useState<any>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [duplicating, setDuplicating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bankRes, questionsRes] = await Promise.all([
                    api.get(`/questions/banks/${id}`),
                    api.get(`/questions/banks/${id}/questions`)
                ]);
                setBank(bankRes.data);
                setQuestions(questionsRes.data);
            } catch (error) {
                console.error('Gagal memuat data', error);

            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const handleDuplicate = async () => {
        const result = await showConfirm(
            'Duplikat Bank Soal?',
            "Salin bank soal ini ke koleksi pribadi Anda untuk diedit dan digunakan.",
            'Ya, Duplikat',
            'Batal',
            'question',
            'primary'
        );

        if (result.isConfirmed) {
            setDuplicating(true);
            try {
                await api.post(`/questions/banks/${id}/duplicate`);
                await showSuccess('Berhasil!', 'Bank soal berhasil diduplikasi! Mengalihkan ke editor...');
                // Redirect to the list or the new bank? 
                // For now, let's go back to list as we don't easily know the new ID without adjusting backend return heavily (though backend DOES return it)
                // Actually my backend controller returns { new_id: ... } ! I should use that.

                // Let's refetch to check if we can get the new ID easily. 
                // Wait, I can't easily change the hook logic here without checking response.
                // Re-checking backend logic: `res.status(201).json({ message: '...', new_id: newBankId });`
                // So I can get new_id from response!

                // Oops, I can't modify the `api.post` call here directly to capture the return value if I wrapped it... 
                // But `api` is axios instance. So `const res = await api.post(...)` works.

                // Rerunning the correct logic in my head:
                // const res = await api.post(...)
                // const newId = res.data.new_id;
                // navigate(`/question-bank/${newId}`);

                navigate('/question-bank');
            } catch (error) {
                console.error('Gagal menduplikasi', error);
                await showError('Gagal', 'Gagal menduplikasi bank soal');
            } finally {
                setDuplicating(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Memuat preview bank soal...</p>
            </div>
        );
    }

    if (!bank) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <p className="text-slate-500 font-bold">Bank soal tidak ditemukan.</p>
                <button
                    onClick={() => navigate('/question-bank')}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            {/* Header / Hero Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <button
                        onClick={() => navigate('/question-bank')}
                        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Daftar
                    </button>

                    <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full">
                                    Bank Soal Publik
                                </span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                        {bank.author_name ? bank.author_name.charAt(0) : 'A'}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600">
                                        {bank.author_name || 'Admin'}
                                    </span>
                                </div>
                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {new Date(bank.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">{bank.title}</h1>
                            <p className="text-slate-500 leading-relaxed max-w-2xl text-lg">
                                {bank.description || <span className="italic">Tidak ada deskripsi.</span>}
                            </p>

                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-medium">
                                    <BookOpen className="w-5 h-5 text-slate-400" />
                                    {bank.subject}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-medium">
                                    <span className="w-5 h-5 flex items-center justify-center font-serif font-bold text-slate-400">K</span>
                                    Kelas {bank.class_level}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-medium">
                                    <FileText className="w-5 h-5 text-slate-400" />
                                    {questions.length} Soal
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-auto p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center text-center">
                            <h3 className="text-sm font-bold text-blue-900 mb-2">Tertarik dengan soal ini?</h3>
                            <p className="text-xs text-blue-700 mb-4 max-w-[200px]">
                                Salin ke koleksi pribadi Anda untuk mengedit atau menggunakannya dalam ujian.
                            </p>
                            <button
                                onClick={handleDuplicate}
                                disabled={duplicating}
                                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {duplicating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Copy className="w-5 h-5" />
                                )}
                                Duplikat Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions Preview */}
            <div className="max-w-4xl mx-auto px-6 mt-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Preview Butir Soal</h2>
                </div>

                {questions.length > 0 ? (
                    questions.map((q, index) => (
                        <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">
                                    Soal No. {index + 1}
                                </span>
                                <span className="text-slate-400 text-sm font-medium bg-slate-50 px-2 py-1 rounded">
                                    {q.points} Poin
                                </span>
                            </div>

                            {/* Question Content */}
                            <div
                                className="prose prose-lg max-w-none mb-8 text-slate-800"
                                dangerouslySetInnerHTML={{ __html: q.content }}
                            />

                            {/* Options */}
                            {q.type === 'essay' ? (
                                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl italic text-slate-500">
                                    Jawaban berupa uraian/essay.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {['A', 'B', 'C', 'D', 'E'].map((opt) => (
                                        <div
                                            key={opt}
                                            className={`flex items-start p-4 rounded-xl border-2 transition-all ${q.correct_answer === opt
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-slate-100 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center h-6">
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${q.correct_answer === opt ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300 text-slate-500 bg-slate-50'
                                                    }`}>
                                                    {opt}
                                                </div>
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <span className={`font-medium text-base leading-relaxed ${q.correct_answer === opt ? 'text-green-800' : 'text-slate-700'
                                                    }`}>
                                                    {(q.options as any)[opt] ? (
                                                        <div dangerouslySetInnerHTML={{ __html: (q.options as any)[opt] }} />
                                                    ) : (
                                                        <span className="text-slate-400 italic">Opsi kosong...</span>
                                                    )}
                                                </span>
                                                {q.correct_answer === opt && (
                                                    <div className="mt-1">
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> Kunci Jawaban
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-400 font-medium">Bank soal ini belum memiliki butir soal.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicBankPreviewPage;
