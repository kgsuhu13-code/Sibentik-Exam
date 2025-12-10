import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Users, Clock, CheckCircle, ArrowLeft, RefreshCw, Lock, Unlock, AlertTriangle, RotateCcw, X, Loader2 } from 'lucide-react';
import { showConfirm, showSuccess, showError } from '../utils/alert';

interface StudentMonitor {
    student_id: number;
    student_name: string;
    username: string;
    status: 'not_started' | 'ongoing' | 'completed';
    start_time: string | null;
    end_time: string | null;
    current_question: number;
    score: number;
    correct_count: number;
    wrong_count: number;
    unanswered_count: number;
    is_locked: boolean;
    violation_count: number;
    violation_log: { time: string; reason: string }[];
    essay_stats: {
        answered: number;
        total: number;
    };
}

interface MonitorData {
    exam_title: string;
    exam_token: string;
    created_by: number;
    class_level: string;
    total_students: number;
    started_count: number;
    finished_count: number;
    students: StudentMonitor[];
}

const ExamMonitorPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState<MonitorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingStudentId, setProcessingStudentId] = useState<number | null>(null);

    // State untuk Modal Pelanggaran
    const [violationModal, setViolationModal] = useState<{
        isOpen: boolean;
        studentName: string;
        logs: { time: string; reason: string }[];
    }>({
        isOpen: false,
        studentName: '',
        logs: []
    });

    const fetchMonitorData = async () => {
        try {
            const response = await api.get(`/exams/${id}/monitor`);
            setData(response.data);
        } catch (error) {
            console.error('Gagal mengambil data monitoring', error);
            showToast('Gagal mengambil data monitoring', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMonitorData();
        // Auto refresh every 5 seconds
        const interval = setInterval(fetchMonitorData, 5000);
        return () => clearInterval(interval);
    }, [id]);



    const handleForceFinish = async (studentId: number, studentName: string) => {
        const result = await showConfirm(
            'Paksa Selesai?',
            `Apakah Anda yakin ingin memaksa selesai ujian untuk siswa ${studentName}? Nilai akan dihitung otomatis berdasarkan jawaban terakhir.`,
            'Ya, Lanjutkan',
            'Batal',
            'warning',
            'warning'
        );

        if (result.isConfirmed) {
            setProcessingStudentId(studentId);
            try {
                await api.post(`/exams/${id}/monitor/${studentId}/finish`);
                await showSuccess('Berhasil', 'Ujian berhasil dipaksa selesai.');
                fetchMonitorData();
            } catch (error) {
                console.error('Gagal memaksa selesai', error);
                await showError('Gagal', 'Gagal memproses permintaan.');
            } finally {
                setProcessingStudentId(null);
            }
        }
    };

    const handleUnlock = async (studentId: number, studentName: string) => {
        const result = await showConfirm(
            'Buka Kunci Ujian?',
            `Apakah Anda yakin ingin membuka kunci ujian untuk siswa ${studentName}?`,
            'Ya, Lanjutkan',
            'Batal',
            'question',
            'primary'
        );

        if (result.isConfirmed) {
            setProcessingStudentId(studentId);
            try {
                await api.post(`/exams/${id}/unlock-student`, { studentId });
                await showSuccess('Berhasil', 'Ujian berhasil dibuka kembali.');
                fetchMonitorData();
            } catch (error) {
                console.error('Gagal membuka kunci', error);
                await showError('Gagal', 'Gagal membuka kunci ujian.');
            } finally {
                setProcessingStudentId(null);
            }
        }
    };

    const handleReset = async (studentId: number, studentName: string) => {
        const result = await showConfirm(
            'Reset Ujian?',
            `PERINGATAN: Anda akan MERESET ujian siswa ${studentName}. Semua jawaban akan DIHAPUS dan siswa harus memulai dari awal. Tindakan ini tidak dapat dibatalkan.`,
            'Ya, Lanjutkan',
            'Batal',
            'error',
            'danger'
        );

        if (result.isConfirmed) {
            setProcessingStudentId(studentId);
            try {
                await api.post(`/exams/${id}/reset`, { studentId });
                await showSuccess('Berhasil', 'Ujian berhasil direset. Siswa dapat login kembali.');
                fetchMonitorData();
            } catch (error) {
                console.error('Gagal mereset ujian', error);
                await showError('Gagal', 'Gagal mereset ujian.');
            } finally {
                setProcessingStudentId(null);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">Data tidak ditemukan.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Kembali</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans relative">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/exam-schedule')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{data.exam_title}</h1>
                        <p className="text-sm text-slate-500">Monitoring Kelas {data.class_level}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Token Display */}
                    <div className="bg-indigo-50 px-5 py-2 rounded-xl border border-indigo-100 flex flex-col items-center shadow-sm">
                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Token Ujian</span>
                        <span className="text-2xl font-black text-indigo-700 tracking-[0.2em] font-mono leading-none mt-1 select-all">
                            {data.exam_token}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live Update
                        </span>
                        <button onClick={fetchMonitorData} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors" title="Refresh Data">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-8 max-w-7xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Siswa</p>
                            <h3 className="text-2xl font-bold text-slate-800">{data.total_students}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Sedang Mengerjakan</p>
                            <h3 className="text-2xl font-bold text-slate-800">{data.started_count - data.finished_count}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Selesai</p>
                            <h3 className="text-2xl font-bold text-slate-800">{data.finished_count}</h3>
                        </div>
                    </div>
                </div>

                {/* Student List Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Status Pengerjaan Siswa</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Nama Siswa</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Waktu Mulai</th>
                                    <th className="px-6 py-4">Progres</th>
                                    <th className="px-6 py-4 text-center">Nilai</th>
                                    <th className="px-6 py-4 text-center">Benar</th>
                                    <th className="px-6 py-4 text-center">Salah</th>
                                    <th className="px-6 py-4 text-center">Esai</th>
                                    <th className="px-6 py-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.students.map((student) => (
                                    <tr key={student.student_id} className={`hover:bg-slate-50 transition-colors ${student.is_locked ? 'bg-red-50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800 flex items-center gap-2">
                                                {student.student_name.split(' ')[0]}
                                                {student.is_locked && (
                                                    <Lock className="w-4 h-4 text-red-600" />
                                                )}
                                            </div>
                                            {student.violation_count > 0 && (
                                                <button
                                                    onClick={() => setViolationModal({ isOpen: true, studentName: student.student_name, logs: student.violation_log || [] })}
                                                    className="text-xs text-orange-600 flex items-center gap-1 mt-1 hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors border border-orange-200"
                                                >
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {student.violation_count} Pelanggaran (Lihat)
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {student.is_locked ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                                                    TERKUNCI
                                                </span>
                                            ) : (
                                                <>
                                                    {student.status === 'not_started' && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                            Belum Mulai
                                                        </span>
                                                    )}
                                                    {student.status === 'ongoing' && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 animate-pulse">
                                                            Mengerjakan
                                                        </span>
                                                    )}
                                                    {student.status === 'completed' && (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            Selesai
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {student.start_time ? `${new Date(student.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {student.status === 'ongoing' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }}></div> {/* Placeholder width */}
                                                    </div>
                                                    <span className="text-xs font-medium text-blue-600">Soal No. {student.current_question}</span>
                                                </div>
                                            ) : student.status === 'completed' ? (
                                                <span className="text-sm font-medium text-green-600">100%</span>
                                            ) : (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                                            {student.status === 'completed' ? student.score : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-green-600 font-medium">
                                            {student.status === 'completed' ? student.correct_count : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-red-500 font-medium">
                                            {student.status === 'completed' ? student.wrong_count : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium">
                                            {student.essay_stats && student.essay_stats.total > 0 ? (
                                                <span className={`px-2 py-0.5 rounded ${student.essay_stats.answered === student.essay_stats.total ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-600'}`}>
                                                    {student.essay_stats.answered} / {student.essay_stats.total}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {student.is_locked ? (
                                                <button
                                                    onClick={() => handleUnlock(student.student_id, student.student_name)}
                                                    disabled={processingStudentId === student.student_id}
                                                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-colors flex items-center gap-1 mx-auto"
                                                    title="Buka Kunci Ujian"
                                                >
                                                    {processingStudentId === student.student_id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Unlock className="w-3 h-3" />
                                                    )}
                                                    Unlock
                                                </button>
                                            ) : (
                                                <>
                                                    {student.status === 'completed' && (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {user?.id === data.created_by && (
                                                                <button
                                                                    onClick={() => navigate(`/exam/${id}/review/${student.student_id}`)}
                                                                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                                >
                                                                    Koreksi
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleReset(student.student_id, student.student_name)}
                                                                disabled={processingStudentId === student.student_id}
                                                                className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                                                                title="Reset Ujian (Ulang dari Awal)"
                                                            >
                                                                {processingStudentId === student.student_id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <RotateCcw className="w-3 h-3" />
                                                                )}
                                                                Reset
                                                            </button>
                                                        </div>
                                                    )}
                                                    {student.status === 'ongoing' && (
                                                        <button
                                                            onClick={() => handleForceFinish(student.student_id, student.student_name)}
                                                            disabled={processingStudentId === student.student_id}
                                                            className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors ml-2 flex items-center gap-1"
                                                            title="Paksa Selesai (Hitung Nilai)"
                                                        >
                                                            {processingStudentId === student.student_id ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : null}
                                                            Stop
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {data.students.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                            Belum ada siswa terdaftar di kelas ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>



            {/* VIOLATION LOG MODAL */}
            {violationModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                Riwayat Pelanggaran
                            </h3>
                            <button
                                onClick={() => setViolationModal(prev => ({ ...prev, isOpen: false }))}
                                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-slate-500">Siswa: <span className="font-bold text-slate-800">{violationModal.studentName}</span></p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {violationModal.logs && violationModal.logs.length > 0 ? (
                                violationModal.logs.map((log, idx) => (
                                    <div key={idx} className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Pelanggaran #{idx + 1}</span>
                                            <span className="text-[10px] text-orange-400">
                                                {new Date(log.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 font-medium">{log.reason}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    <p>Tidak ada detail pelanggaran tercatat.</p>
                                    <p className="text-xs mt-1 text-slate-300">(Pelanggaran mungkin terjadi sebelum fitur pencatatan detail diaktifkan)</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setViolationModal(prev => ({ ...prev, isOpen: false }))}
                                className="w-full py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamMonitorPage;
