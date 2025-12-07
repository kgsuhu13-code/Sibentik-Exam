import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Users, Upload, ArrowLeft, Download, Plus, X, GraduationCap, UserCheck, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { showError, showSuccess, showConfirm } from '../utils/alert';

interface School {
    id: number;
    name: string;
    address: string;
    subscription_status: string;
    max_students: number;
    student_count: number;
    teacher_count: number;
}

interface User {
    id: number;
    full_name: string;
    username: string;
    class_level: string | null;
}

const AdminSchoolDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [school, setSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    // Data State
    const [students, setStudents] = useState<User[]>([]);
    const [teachers, setTeachers] = useState<User[]>([]);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        full_name: '',
        class_level: '',
        role: 'student'
    });

    // Pagination & Search State for Students
    const [studentPage, setStudentPage] = useState(1);
    const [studentTotalPages, setStudentTotalPages] = useState(1);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentDebounce, setStudentDebounce] = useState(''); // Actual search term sent to API

    // Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setStudentDebounce(studentSearch);
            setStudentPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [studentSearch]);

    useEffect(() => {
        fetchSchoolDetails();
    }, [id]);

    // Fetch students whenever page or debounce search changes
    useEffect(() => {
        if (school) {
            fetchUsers(school.id, 'student', studentPage, studentDebounce);
        }
    }, [studentPage, studentDebounce, school?.id]);

    const fetchSchoolDetails = async () => {
        try {
            const response = await api.get('/admin/schools');
            const foundSchool = response.data.find((s: School) => s.id === Number(id));

            if (foundSchool) {
                setSchool(foundSchool);
                // Fetch both lists
                // Fetch both lists (Teacher no pagination for now, Student with pagination)
                fetchUsers(foundSchool.id, 'teacher');
            } else {
                showError('Error', 'Sekolah tidak ditemukan');
                navigate('/admin/schools');
            }
        } catch (error) {
            console.error('Failed to fetch school details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async (schoolId: number, role: 'student' | 'teacher', page = 1, search = '') => {
        try {
            const params: any = {
                school_id: schoolId,
                role: role,
                page: page, // Use dynamic page
                limit: 10,  // Back to 10 limit
            };

            if (search) {
                params.search = search;
            }

            // Teachers usually few, fetch all or default logic? Keep logic consistent.
            // If calling for teacher without pagination args, it defaults to pg 1
            if (role === 'teacher') {
                params.limit = 100; // Allow more for teachers just in case
            }

            const response = await api.get('/admin/users', { params });

            if (response.data.data) {
                if (role === 'student') {
                    setStudents(response.data.data);
                    setStudentTotalPages(response.data.totalPages);
                } else {
                    setTeachers(response.data.data);
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${role}s:`, error);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/admin/users', {
                ...newUser,
                school_id: id
            });
            showSuccess('Berhasil', `${newUser.role === 'student' ? 'Siswa' : 'Guru'} berhasil ditambahkan`);
            setShowAddModal(false);
            setNewUser({ username: '', password: '', full_name: '', class_level: '', role: 'student' });

            fetchSchoolDetails(); // Refresh stats
            fetchSchoolDetails(); // Refresh stats
            if (newUser.role === 'teacher') {
                fetchUsers(Number(id), 'teacher');
            } else {
                fetchUsers(Number(id), 'student', studentPage, studentDebounce);
            }

        } catch (error: any) {
            showError('Gagal', error.response?.data?.message || 'Gagal menambahkan pengguna');
        } finally {
            setSubmitting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('school_id', id as string);

        setImporting(true);
        try {
            const response = await api.post('/admin/import-students', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { successCount, errorCount, errors } = response.data;

            if (errorCount > 0) {
                showError('Import Selesai dengan Catatan', `Berhasil: ${successCount}, Gagal: ${errorCount}. \n${errors.slice(0, 3).join('\n')}...`);
            } else {
                showSuccess('Import Berhasil', `${successCount} siswa berhasil ditambahkan.`);
            }

            fetchSchoolDetails();
            fetchSchoolDetails();
            fetchUsers(Number(id), 'student', 1, ''); // Reset to first page
            setStudentSearch('');

        } catch (error: any) {
            showError('Gagal Import', error.response?.data?.message || 'Terjadi kesalahan saat upload.');
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const downloadTemplate = () => {
        const headers = ['username', 'password', 'full_name', 'class_level'];
        const rows = [
            ['siswa001', 'password123', 'Budi Santoso', 'X-IPA-1'],
            ['siswa002', 'password123', 'Siti Aminah', 'X-IPA-1']
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "template_siswa.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteUser = async (userId: number, userName: string, role: 'student' | 'teacher') => {
        const result = await showConfirm(
            'Hapus Pengguna',
            `Yakin ingin menghapus ${role === 'student' ? 'siswa' : 'guru'} ${userName}?`,
            'Ya, Hapus',
            'Batal'
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/users/${userId}`);
                showSuccess('Terhapus', 'Pengguna berhasil dihapus');
                fetchSchoolDetails();
                fetchUsers(Number(id), role);
            } catch (error) {
                console.error('Failed delete:', error);
                showError('Gagal', 'Gagal menghapus pengguna');
            }
        }
    };

    const handleDeleteAll = async (role: 'student' | 'teacher') => {
        const result = await showConfirm(
            `Hapus Semua ${role === 'student' ? 'Siswa' : 'Guru'}?`,
            `PERINGATAN: Tindakan ini akan menghapus SEMUA data ${role === 'student' ? 'siswa' : 'guru'} di sekolah ini secara permanen. Tidak bisa dibatalkan!`,
            'Ya, Hapus Semua',
            'Batal',
            'error',
            'danger'
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/schools/${id}/users?role=${role}`);
                showSuccess('Terhapus', `Semua data ${role === 'student' ? 'siswa' : 'guru'} berhasil dihapus`);
                fetchSchoolDetails();
                fetchUsers(Number(id), role);
            } catch (error) {
                console.error('Failed bulk delete:', error);
                showError('Gagal', 'Gagal menghapus data massal');
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Memuat...</div>;
    if (!school) return <div className="p-8 text-center">Sekolah tidak ditemukan</div>;

    return (
        <div className="space-y-6">
            <button onClick={() => navigate('/admin/schools')} className="flex items-center text-slate-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Sekolah
            </button>

            {/* Modal Tambah Pengguna */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Tambah Pengguna Manual</h3>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="student">Siswa</option>
                                    <option value="teacher">Guru</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newUser.full_name}
                                    onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            {newUser.role === 'student' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: X-IPA-1"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newUser.class_level}
                                        onChange={e => setNewUser({ ...newUser, class_level: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{school.name}</h1>
                            <p className="text-slate-500">{school.address}</p>
                            <div className="mt-2 flex gap-2">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${school.subscription_status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    {school.subscription_status.toUpperCase()}
                                </span>
                                <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
                                    ID: {school.id}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-slate-500">Total Akun</p>
                        <p className="text-3xl font-bold text-slate-800">
                            {Number(school.student_count) + Number(school.teacher_count)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        Kelola Data Pengguna
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Tambahkan pengguna (Siswa/Guru) secara manual atau upload file Excel/CSV untuk import siswa massal.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Tambah Manual
                        </button>

                        <div className="flex gap-3">
                            <label className={`flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    className="hidden"
                                    onChange={handleImport}
                                    disabled={importing}
                                />
                                <span className="text-sm font-medium text-blue-600">
                                    {importing ? 'Mengupload...' : 'Import Siswa (Excel)'}
                                </span>
                            </label>

                            <button
                                onClick={downloadTemplate}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Download Template CSV"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Statistik Pengguna
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">Guru Terdaftar</span>
                            <span className="font-bold text-slate-800">{school.teacher_count}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-600">Siswa Terdaftar</span>
                            <span className="font-bold text-slate-800">{school.student_count}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teacher List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Daftar Guru</h3>
                    </div>
                    {teachers.length > 0 && (
                        <button
                            onClick={() => handleDeleteAll('teacher')}
                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-3 h-3" /> Hapus Semua Guru
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3 text-left">Nama Lengkap</th>
                                <th className="px-6 py-3 text-left">Username</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {teachers.length > 0 ? (
                                teachers.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-slate-50 group">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{teacher.full_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{teacher.username}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                                                Aktif
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(teacher.id, teacher.full_name, 'teacher')}
                                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                                                title="Hapus Guru"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        Belum ada data guru.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Daftar Siswa</h3>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Box */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama/username..."
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                            />
                        </div>

                        {students.length > 0 && (
                            <button
                                onClick={() => handleDeleteAll('student')}
                                className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                            >
                                <Trash2 className="w-3 h-3" /> Hapus Semua
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3 text-left">Nama Lengkap</th>
                                <th className="px-6 py-3 text-left">Username</th>
                                <th className="px-6 py-3 text-left">Kelas</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 group">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{student.full_name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{student.username}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{student.class_level || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                                                Aktif
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteUser(student.id, student.full_name, 'student')}
                                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                                                title="Hapus Siswa"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        {studentSearch ? 'Tidak ada siswa yang cocok dengan pencarian.' : 'Belum ada data siswa.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Halaman {studentPage} dari {studentTotalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={studentPage === 1}
                            onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                            className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={studentPage === studentTotalPages || studentTotalPages === 0}
                            onClick={() => setStudentPage(p => Math.min(studentTotalPages, p + 1))}
                            className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSchoolDetailPage;
