
import { useState, useEffect } from 'react';
import {
    FileText, Search, Users, Download, ArrowLeft, CheckCircle,
    Clock, Award
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface ExamSummary {
    id: number;
    title: string;
    subject: string;
    class_level: string;
    start_time: string;
    end_time: string;
    exam_token: string;
    participant_count: number;
    finished_count: number;
    avg_score: number | string;
    max_score: number;
    min_score: number;
}

interface StudentResult {
    student_id: number;
    student_name: string;
    username: string;
    status: string;
    score: number;
    correct_count: number;
    wrong_count: number;
    unanswered_count: number;
    start_time: string | null;
    end_time: string | null;
    essay_stats: {
        answered: number;
        total: number;
    };
}

interface ExamDetailData {
    exam_title: string;
    class_level: string;
    total_students: number;
    started_count: number;
    finished_count: number;
    students: StudentResult[];
}

const TeacherGradesPage = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [loading, setLoading] = useState(false);

    // List State
    const [exams, setExams] = useState<ExamSummary[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Detail State
    const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
    const [examDetail, setExamDetail] = useState<ExamDetailData | null>(null);

    // Fetch Exams List
    useEffect(() => {
        if (view === 'list') {
            fetchExams();
        }
    }, [view]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/exams/grades');
            setExams(response.data);
        } catch (error) {
            console.error('Gagal mengambil data nilai', error);
            toast.error('Gagal memuat data nilai ujian');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Exam Detail
    const handleViewDetail = async (examId: number) => {
        setLoading(true);
        setSelectedExamId(examId);
        try {
            // Reusing monitor endpoint as it contains all necessary grade data
            const response = await api.get(`/exams/${examId}/monitor`);
            setExamDetail(response.data);
            setView('detail');
        } catch (error) {
            console.error('Gagal mengambil detail nilai', error);
            toast.error('Gagal memuat detail nilai');
        } finally {
            setLoading(false);
        }
    };

    // Export Handler
    const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
        if (!examDetail) return;

        // Prepare Data Rows (formatted)
        const dataRows = examDetail.students.map((s, index) => ({
            No: index + 1,
            Nama: s.student_name,
            Username: s.username,
            Status: s.status === 'completed' ? 'Selesai' : s.status === 'in_progress' ? 'Mengerjakan' : 'Belum Mulai',
            Nilai: s.score,
            Benar: s.correct_count,
            Salah: s.wrong_count,
            Waktu_Mulai: s.start_time ? new Date(s.start_time).toLocaleString('id-ID') : '-',
            Waktu_Selesai: s.end_time ? new Date(s.end_time).toLocaleString('id-ID') : '-'
        }));

        if (type === 'excel') {
            const wb = XLSX.utils.book_new();

            // --- Header Construction "Kop" ---
            const headers = [
                ['SIBENTIK EXAM - UJIAN SEKOLAH DIGITAL'],
                ['Platform Ujian Berbasis Komputer & Smartphone'],
                [''],
                ['LAPORAN HASIL UJIAN SISWA'],
                [''],
            ];

            // Exam Details Section
            const metaInfo = [
                ['Nama Ujian', `: ${examDetail.exam_title}`],
                ['Kelas / Jenjang', `: ${examDetail.class_level}`],
                ['Total Peserta', `: ${examDetail.finished_count} Selesai / ${examDetail.total_students} Total`],
                ['Tanggal Export', `: ${new Date().toLocaleString('id-ID')}`],
                ['']
            ];

            // Table Headers
            const tableHeaders = [
                ['No', 'Nama Siswa', 'Username', 'Status', 'Nilai', 'Benar', 'Salah', 'Waktu Mulai', 'Waktu Selesai']
            ];

            // Combine Data
            const tableData = dataRows.map(row => Object.values(row));
            const finalSheetData = [...headers, ...metaInfo, ...tableHeaders, ...tableData];

            // Create Sheet
            const ws = XLSX.utils.aoa_to_sheet(finalSheetData);

            // --- STYLING DEFINITIONS ---
            const borderStyle = {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            };

            const titleStyle = {
                font: { bold: true, sz: 14, color: { rgb: "000000" } },
                alignment: { horizontal: "center", vertical: "center" }
            };

            const taglineStyle = {
                font: { italic: true, sz: 10, color: { rgb: "444444" } },
                alignment: { horizontal: "center", vertical: "center" }
            };

            const reportTitleStyle = {
                font: { bold: true, sz: 12, underline: true },
                alignment: { horizontal: "center", vertical: "center" }
            };

            const tableHeaderStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4F81BD" } }, // Blue Header
                alignment: { horizontal: "center", vertical: "center" },
                border: borderStyle
            };

            const dataCenterStyle = {
                alignment: { horizontal: "center", vertical: "center" },
                border: borderStyle
            };

            const dataLeftStyle = {
                alignment: { horizontal: "left", vertical: "center" },
                border: borderStyle
            };

            // Apply Styles to specific cells
            const range = XLSX.utils.decode_range(ws['!ref'] as string);

            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) continue;

                    // 1. Kop Title (Row 0)
                    if (R === 0) ws[cellAddress].s = titleStyle;
                    // 2. Tagline (Row 1)
                    else if (R === 1) ws[cellAddress].s = taglineStyle;
                    // 3. Report Title (Row 3)
                    else if (R === 3) ws[cellAddress].s = reportTitleStyle;
                    // 4. Meta Info (Rows 5-8)
                    else if (R >= 5 && R <= 8) {
                        ws[cellAddress].s = { font: { bold: C === 0 } }; // Bold First Column
                    }
                    // 5. Table Header (Row 10)
                    else if (R === 10) {
                        ws[cellAddress].s = tableHeaderStyle;
                    }
                    // 6. Data Rows (Row 11+)
                    else if (R >= 11) {
                        // Columns: No(0), Nama(1), Username(2), Status(3), Nilai(4), Benar(5), Salah(6), Mulai(7), Selesai(8)
                        // Left Align: Nama (1), Username (2) - optional
                        if (C === 1) ws[cellAddress].s = dataLeftStyle;
                        else ws[cellAddress].s = dataCenterStyle;
                    }
                }
            }

            // --- Merges ---
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push(
                { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
                { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }
            );

            // --- Column Widths ---
            ws['!cols'] = [
                { wch: 5 },  // No
                { wch: 35 }, // Nama
                { wch: 15 }, // Username
                { wch: 15 }, // Status
                { wch: 10 }, // Nilai
                { wch: 10 }, // Benar
                { wch: 10 }, // Salah
                { wch: 22 }, // Mulai
                { wch: 22 }  // Selesai
            ];

            XLSX.utils.book_append_sheet(wb, ws, "Nilai Siswa");
            XLSX.writeFile(wb, `Laporan_Nilai_${examDetail.exam_title?.replace(/\s+/g, '_')}.xlsx`);
            toast.success('Berhasil mengunduh Excel (.xlsx)');

        } else if (type === 'pdf') {
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

            // --- Load Logo ---
            const img = new Image();
            img.src = '/logo.jpg';
            img.onload = () => {
                // Header (Kop)
                doc.addImage(img, 'JPEG', 14, 10, 20, 20); // Logo Left

                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.text("SIBENTIK EXAM - UJIAN SEKOLAH DIGITAL", 40, 18);

                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.text("Platform Ujian Berbasis Komputer & Smartphone", 40, 25);

                // Line
                doc.setLineWidth(0.5);
                doc.line(14, 35, 283, 35);

                // Report Title
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("LAPORAN HASIL UJIAN SISWA", 148.5, 45, { align: "center" });

                // Meta Info
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                const startY = 55;
                doc.text(`Nama Ujian      : ${examDetail.exam_title}`, 14, startY);
                doc.text(`Kelas / Jenjang : ${examDetail.class_level}`, 14, startY + 5);
                doc.text(`Total Peserta   : ${examDetail.finished_count} Selesai / ${examDetail.total_students} Total`, 14, startY + 10);
                doc.text(`Tanggal Export  : ${new Date().toLocaleString('id-ID')}`, 14, startY + 15);

                // Table
                autoTable(doc, {
                    startY: startY + 25,
                    head: [['No', 'Nama Siswa', 'Username', 'Status', 'Nilai', 'Benar', 'Salah', 'Waktu Mulai', 'Waktu Selesai']],
                    body: dataRows.map(row => Object.values(row)),
                    theme: 'grid',
                    headStyles: { fillColor: [79, 129, 189], textColor: 255, halign: 'center' },
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 10 }, // No
                        1: { halign: 'left' }, // Nama
                        2: { halign: 'center' }, // Username
                        3: { halign: 'center' }, // Status
                        4: { halign: 'center' }, // Nilai
                        5: { halign: 'center' }, // Benar
                        6: { halign: 'center' }, // Salah
                        7: { halign: 'center' }, // Mulai
                        8: { halign: 'center' }  // Selesai
                    },
                    styles: { fontSize: 9 },
                });

                doc.save(`Laporan_Nilai_${examDetail.exam_title?.replace(/\s+/g, '_')}.pdf`);
                toast.success('Berhasil mengunduh PDF');
            };

            img.onerror = () => {
                toast.error('Gagal memuat logo untuk PDF. Pastikan file logo.jpg tersedia.');
                // Proceed without logo if fail, or just return
            };
        } else {
            // CSV Logic
            const headers = Object.keys(dataRows[0]).join(',');
            const csvRows = dataRows.map(row => Object.values(row).map(val => `"${val}"`).join(','));
            const csvContent = "data:text/csv;charset=utf-8," + [headers, ...csvRows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Nilai_${examDetail.exam_title}_${examDetail.class_level}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Berhasil mengunduh CSV');
        }
    };

    const filteredExams = exams.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 font-sans text-slate-900">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {view === 'list' ? 'Rekapitulasi Hasil & Nilai' : `Detail Nilai: ${examDetail?.exam_title}`}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {view === 'list'
                            ? 'Pantau kemajuan akademik siswa melalui analisis nilai ujian.'
                            : `Kelas ${examDetail?.class_level} • ${examDetail?.finished_count} Selesai dari ${examDetail?.total_students} Siswa`}
                    </p>
                </div>
                {view === 'detail' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('list')}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-bold text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-bold text-sm shadow-sm transition-all"
                        >
                            <FileText className="w-4 h-4" /> Export PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold text-sm shadow-sm transition-all"
                        >
                            <Download className="w-4 h-4" /> Export Excel (XLSX)
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {view === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Cari nama ujian atau mata pelajaran..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {/* Optional Filter Buttons */}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Nama Ujian</th>
                                    <th className="px-6 py-4">Kelas & Mapel</th>
                                    <th className="px-6 py-4 text-center">Partisipan</th>
                                    <th className="px-6 py-4 text-center">Rata-Rata</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                                            <p>Memuat data...</p>
                                        </td>
                                    </tr>
                                ) : filteredExams.length > 0 ? (
                                    filteredExams.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{exam.title}</div>
                                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(exam.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700">{exam.subject}</div>
                                                <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold mt-1">
                                                    Kelas {exam.class_level}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="text-sm font-bold text-slate-700">
                                                    {exam.finished_count} <span className="text-slate-400 font-normal">/ {exam.participant_count}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${Number(exam.avg_score) >= 75 ? 'bg-green-100 text-green-700' :
                                                    Number(exam.avg_score) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {exam.avg_score}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {new Date() > new Date(exam.end_time) ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                                        <CheckCircle className="w-3 h-3" /> Selesai
                                                    </span>
                                                ) : new Date() >= new Date(exam.start_time) ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold animate-pulse">
                                                        <Clock className="w-3 h-3" /> Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                                                        <Clock className="w-3 h-3" /> Terjadwal
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleViewDetail(exam.id)}
                                                    className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 font-bold text-sm rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                                                >
                                                    Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            Tidak ada data ujian ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Detail Stats Grid */}
                    {examDetail && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">{examDetail.finished_count}</div>
                                    <div className="text-xs text-slate-500 font-medium">Siswa Selesai</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                    <Award className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {Math.max(...examDetail.students.map(s => Number(s.score) || 0)).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">Nilai Tertinggi</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                    <Award className="w-6 h-6 rotate-180" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {Math.min(...examDetail.students.filter(s => s.status === 'completed').map(s => Number(s.score) || 0)).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">Nilai Terendah</div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-800">
                                        {(examDetail.students.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / (examDetail.finished_count || 1)).toFixed(1)}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">Rata-Rata Kelas</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Students Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 w-10 text-center">No</th>
                                    <th className="px-6 py-4">Nama Siswa</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Benar / Salah</th>
                                    <th className="px-6 py-4 text-center">Nilai Akhir</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {examDetail?.students.map((student, idx) => (
                                    <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{student.student_name}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{student.username}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {student.status === 'completed' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">
                                                    Selesai
                                                </span>
                                            ) : student.status === 'in_progress' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700">
                                                    Mengerjakan
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500">
                                                    Belum Mulai
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium">
                                            <span className="text-green-600">{student.correct_count}</span>
                                            <span className="text-slate-300 mx-1">/</span>
                                            <span className="text-red-500">{student.wrong_count}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-lg font-bold ${student.score >= 75 ? 'text-green-600' :
                                                student.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {Number(student.score).toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/exam/${selectedExamId}/review/${student.student_id}`)}
                                                className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline"
                                            >
                                                Lihat Jawaban
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherGradesPage;
