import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, GraduationCap, Plus } from 'lucide-react';
import api from '../services/api';

interface School {
    id: number;
    name: string;
    address: string;
    subscription_status: string;
    max_students: number;
    student_count: number;
    teacher_count: number;
    active_exams: number;
}

const AdminSchoolsPage = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newSchool, setNewSchool] = useState({
        name: '',
        address: '',
        max_students: 1000,
        subscription_status: 'active'
    });

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            const response = await api.get('/admin/schools');
            setSchools(response.data);
        } catch (error) {
            console.error('Failed to fetch schools:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/admin/schools', newSchool);
            fetchSchools();
            setShowAddModal(false);
            setNewSchool({ name: '', address: '', max_students: 1000, subscription_status: 'active' });
        } catch (error) {
            console.error('Failed to add school:', error);
            alert('Gagal menambahkan sekolah');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Modal Tambah Sekolah */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-5 h-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Tambah Sekolah Baru</h3>
                        <form onSubmit={handleAddSchool} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newSchool.name}
                                    onChange={e => setNewSchool({ ...newSchool, name: e.target.value })}
                                    placeholder="Contoh: SMA Negri 1 Jakarta"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                                <textarea
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newSchool.address}
                                    onChange={e => setNewSchool({ ...newSchool, address: e.target.value })}
                                    placeholder="Alamat lengkap sekolah..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newSchool.subscription_status}
                                        onChange={e => setNewSchool({ ...newSchool, subscription_status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
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
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan Sekolah'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manajemen Sekolah</h1>
                    <p className="text-slate-500">Kelola daftar sekolah dan pantau penggunaan.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Sekolah
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-500">Memuat data sekolah...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {schools.map((school) => (
                        <div key={school.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${school.subscription_status === 'active'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {school.subscription_status.toUpperCase()}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-1">{school.name}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{school.address}</p>

                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3" /> Siswa
                                        </p>
                                        <p className="font-bold text-slate-700">
                                            {school.student_count}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <Users className="w-3 h-3" /> Guru
                                        </p>
                                        <p className="font-bold text-slate-700">{school.teacher_count}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-500">ID: {school.id}</span>
                                <button
                                    onClick={() => navigate(`/admin/schools/${school.id}`)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                    Kelola Detail →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSchoolsPage;
