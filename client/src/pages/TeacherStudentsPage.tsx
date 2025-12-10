
import { useState, useEffect } from 'react';
import { Search, Filter, Users, Shield } from 'lucide-react';
import api from '../services/api';

interface Student {
    id: number;
    full_name: string;
    username: string;
    class_level: string;
    avg_score: number | string;
}

const TeacherStudentsPage = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<string[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    useEffect(() => {
        filterData();
    }, [students, searchQuery, selectedClass]);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Fetch all students initially (can be optimized server-side if too large, but for school level usually OK)
            const res = await api.get('/classes/students');
            setStudents(res.data);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = students;

        // Filter by Class
        if (selectedClass !== 'all') {
            result = result.filter(s => s.class_level === selectedClass);
        }

        // Filter by Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.full_name.toLowerCase().includes(q) ||
                s.username.toLowerCase().includes(q)
            );
        }

        setFilteredStudents(result);
    };

    return (
        <div className="space-y-6 font-sans text-slate-900 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Data Siswa
                    </h1>
                    <p className="text-slate-500 mt-1">Daftar seluruh siswa di sekolah Anda beserta rata-rata nilainya.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-700">{students.length} Total Siswa</span>
                    </div>
                </div>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau NISN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="flex-1 md:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Semua Kelas</option>
                        {classes.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm">Memuat data siswa...</p>
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Nama Lengkap</th>
                                    <th className="px-6 py-4">NISN / Username</th>
                                    <th className="px-6 py-4">Kelas</th>
                                    <th className="px-6 py-4">Rata-rata Nilai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{student.full_name}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-slate-600">
                                            {student.username}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                                {student.class_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {Number(student.avg_score) > 0 ? (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${Number(student.avg_score) >= 80 ? 'bg-green-100 text-green-700' :
                                                    Number(student.avg_score) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {Number(student.avg_score).toFixed(1)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-sm italic">Belum ada nilai</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Tidak ada data ditemukan</h3>
                        <p className="text-slate-500 text-sm mt-1">Coba ubah filter atau kata kunci pencarian Anda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherStudentsPage;
