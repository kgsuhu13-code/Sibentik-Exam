import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

import { ArrowLeft, CheckCircle, XCircle, Save, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '../utils/alert';

interface Question {
    id: number;
    type: string;
    content: string;
    options: { id: string; text: string }[];
    correct_answer: string;
    points: number;
}

interface ExamSession {
    id: number;
    answers: Record<string, string>;
    scores: Record<string, number>;
    exam_title: string;
}

const ExamReviewPage = () => {
    const { examId, studentId } = useParams();
    const navigate = useNavigate();


    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<ExamSession | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [manualScores, setManualScores] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                const response = await api.get(`/exams/${examId}/review/${studentId}`);
                const sess = response.data.session;
                const qs = response.data.questions;

                setSession(sess);
                setQuestions(qs);

                // Inisialisasi Nilai Awal (Gabungan Nilai Tersimpan & Nilai Otomatis PG)
                const initialScores: Record<string, number> = {};

                qs.forEach((q: Question) => {
                    // Cek apakah sudah ada nilai manual tersimpan
                    if (sess.scores && sess.scores[q.id] !== undefined) {
                        initialScores[q.id] = sess.scores[q.id];
                    } else {
                        // Jika belum, hitung nilai otomatis (hanya untuk PG)
                        if (q.type !== 'essay') {
                            const studentAns = sess.answers[q.id];
                            const isCorrect = studentAns === q.correct_answer;
                            initialScores[q.id] = isCorrect ? q.points : 0;
                        } else {
                            // Essay default 0 jika belum dinilai
                            initialScores[q.id] = 0;
                        }
                    }
                });

                setManualScores(initialScores);

            } catch (error) {
                console.error('Gagal memuat data review', error);
                await showError('Gagal Memuat', 'Gagal memuat data review siswa.');
            } finally {
                setLoading(false);
            }
        };
        fetchReviewData();
    }, [examId, studentId]);

    const handleScoreChange = (questionId: number, score: number) => {
        setManualScores(prev => ({ ...prev, [questionId]: score }));
    };

    const handleSaveScores = async () => {
        setIsSaving(true);
        try {
            await api.post(`/exams/${examId}/score/${studentId}`, {
                scores: manualScores
            });
            await showSuccess('Berhasil!', 'Nilai berhasil disimpan!');
        } catch (error) {
            console.error('Gagal menyimpan nilai', error);
            await showError('Gagal', 'Gagal menyimpan nilai.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session || questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const studentAnswer = session.answers[currentQuestion.id];
    const isCorrect = studentAnswer === currentQuestion.correct_answer;
    const currentScore = manualScores[currentQuestion.id] ?? (isCorrect ? currentQuestion.points : 0);

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 text-lg leading-tight">Koreksi Jawaban</h1>
                        <p className="text-xs text-slate-500">{session.exam_title}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold uppercase">Total Skor</p>
                        <p className="text-xl font-bold text-blue-600">
                            {Object.values(manualScores).reduce((a, b) => a + b, 0)}
                        </p>
                    </div>
                    <button
                        onClick={handleSaveScores}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${isSaving
                            ? 'bg-blue-400 text-white cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan Nilai
                            </>
                        )}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigasi Soal */}
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col overflow-y-auto p-4">
                    <h3 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">Navigasi Soal</h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                            const ans = session.answers[q.id];
                            const isAnsCorrect = ans === q.correct_answer;
                            // Essay selalu dianggap "perlu review" (kuning) kecuali sudah dinilai
                            const statusColor = q.type === 'essay'
                                ? (manualScores[q.id] !== undefined ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300')
                                : (isAnsCorrect ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300');

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`aspect-square rounded-lg font-bold text-sm flex items-center justify-center border transition-all ${currentQuestionIndex === idx ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                        } ${statusColor}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Kartu Soal */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                            <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">
                                    Soal No. {currentQuestionIndex + 1} ({currentQuestion.type === 'essay' ? 'Essay' : 'Pilihan Ganda'})
                                </span>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-bold text-slate-500">Nilai:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={currentQuestion.points}
                                        value={currentScore}
                                        onChange={(e) => handleScoreChange(currentQuestion.id, Number(e.target.value))}
                                        className="w-20 px-2 py-1 border border-slate-300 rounded-md text-right font-bold text-slate-800 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <span className="text-sm text-slate-400">/ {currentQuestion.points}</span>
                                </div>
                            </div>

                            <div className="prose prose-lg max-w-none mb-8 text-slate-800" dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />

                            {/* Jawaban Siswa & Kunci */}
                            {currentQuestion.type === 'essay' ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                        <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase">Jawaban Siswa:</h4>
                                        <p className="text-slate-800 whitespace-pre-wrap">{studentAnswer || '(Tidak menjawab)'}</p>
                                    </div>
                                    {/* Bisa tambah kunci jawaban essay jika ada di DB */}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option) => {
                                        const isSelected = studentAnswer === option.id;
                                        const isKey = currentQuestion.correct_answer === option.id;

                                        let style = "border-slate-200 bg-white";
                                        let icon = null;

                                        if (isSelected && isKey) {
                                            style = "border-green-500 bg-green-50";
                                            icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                                        } else if (isSelected && !isKey) {
                                            style = "border-red-500 bg-red-50";
                                            icon = <XCircle className="w-5 h-5 text-red-600" />;
                                        } else if (!isSelected && isKey) {
                                            style = "border-green-500 bg-green-50 opacity-70"; // Kunci jawaban yang tidak dipilih
                                            icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                                        }

                                        return (
                                            <div key={option.id} className={`flex items-center p-4 rounded-xl border-2 transition-all ${style}`}>
                                                <div className="flex-1">
                                                    <span className="font-bold mr-3">{option.id}.</span>
                                                    <span className="font-medium">{option.text}</span>
                                                </div>
                                                {icon}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ExamReviewPage;
