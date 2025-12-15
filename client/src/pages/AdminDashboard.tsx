import React, { useEffect, useState } from 'react';
import { Users, Building2, AlertTriangle, CreditCard, Calendar, CheckCircle, XCircle, Activity, Database } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


const MySwal = withReactContent(Swal);

interface School {
    id: number;
    name: string;
    address: string;
    subscription_status: string;
    subscription_end_date: string | null;
    max_students: number;
    student_count: number;
    teacher_count: number;
    active_exams: number;
    total_requests?: number;
    database_footprint?: number;
}

interface ServerHealth {
    uptime: number;
    memory: {
        usagePercentage: number;
    };
    cpu: {
        load: number;
    };
    latency: {
        db: number;
        redis: number;
    };
}

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_schools: 0,
        total_users: 0,
        total_exams: 0,
        expired_schools: 0
    });
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [health, setHealth] = useState<ServerHealth | null>(null);

    const [activeTab, setActiveTab] = useState('overview'); // Just in case needed later

    const fetchData = async () => {
        try {
            const [statsRes, schoolsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/schools')
            ]);
            setStats(statsRes.data);
            setSchools(schoolsRes.data);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const fetchHealth = async () => {
            try {
                const res = await api.get('/admin/health');
                setHealth(res.data);
            } catch (e) {
                console.error('Health check failed', e);
            }
        };

        fetchHealth();
        const interval = setInterval(fetchHealth, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const handleExtendSubscription = async (school: School) => {
        const { value: date } = await MySwal.fire({
            title: `Perpanjang Langganan`,
            html: `Update masa aktif untuk <b>${school.name}</b>`,
            input: 'date',
            inputValue: school.subscription_end_date ? new Date(school.subscription_end_date).toISOString().split('T')[0] : '',
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#3b82f6'
        });

        if (date) {
            try {
                await api.put(`/admin/schools/${school.id}/subscription`, {
                    end_date: date,
                    status: 'active'
                });
                MySwal.fire('Berhasil', 'Masa aktif sekolah berhasil diperbarui', 'success');
                fetchData(); // Refresh data
            } catch (error) {
                MySwal.fire('Gagal', 'Terjadi kesalahan saat menyimpan data', 'error');
            }
        }
    };

    const handleResetStats = async () => {
        const result = await MySwal.fire({
            title: 'Reset Statistik?',
            text: "Apakah Anda yakin ingin mereset penghitung 'Req' SEMUA sekolah menjadi 0? Lakukan ini setiap awal bulan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Reset Semua!'
        });

        if (result.isConfirmed) {
            try {
                await api.post('/admin/schools/reset-stats');
                MySwal.fire('Terhapus!', 'Statistik permintaan telah direset.', 'success');
                fetchData();
            } catch (error) {
                MySwal.fire('Gagal', 'Terjadi kesalahan saat mereset statistik.', 'error');
            }
        }
    };

    // Calculate Estimated Revenue (Mock: Active Schools * 150.000)
    const activeSchools = stats.total_schools - stats.expired_schools;
    const estRevenue = activeSchools * 150000;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Command Center</h1>
                    <p className="text-slate-500 mt-1">Pantau dan kelola seluruh klien sekolah dari satu tempat.</p>
                </div>
                <div className="flex gap-4">
                    {/* CPU/RAM Monitor */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${(health?.memory.usagePercentage || 0) > 80 ? 'bg-red-50 text-red-700 border-red-100' :
                        (health?.memory.usagePercentage || 0) > 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                        <Activity className="w-3.5 h-3.5" />
                        CPU: {health?.cpu.load ? health.cpu.load.toFixed(1) : '0'}% | RAM: {health?.memory.usagePercentage || 0}%
                    </div>
                    {/* Database Monitor */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${(health?.latency.db || 0) > 100 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                        <Database className="w-3.5 h-3.5" />
                        DB: {health?.latency.db || 0}ms
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Sekolah</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.total_schools}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Pengguna</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.total_users}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Sekolah Expired</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.expired_schools}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Est. Pendapatan/bln</p>
                            <h3 className="text-xl font-bold text-slate-800">Rp {estRevenue.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* School Management Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Manajemen Langganan Sekolah</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleResetStats}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                        >
                            Reset Statistik
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
                            + Tambah Sekolah Manual
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Nama Sekolah</th>
                                <th className="px-6 py-4">Pengguna (G/S)</th>
                                <th className="px-6 py-4">Load Server (Req/DB)</th>
                                <th className="px-6 py-4">Status Langganan</th>
                                <th className="px-6 py-4">Berakhir Pada</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {schools.map((school) => {
                                const isExpired = school.subscription_end_date ? new Date(school.subscription_end_date) < new Date() : false;
                                return (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{school.name}</p>
                                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{school.address}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                                {school.teacher_count} <span className="text-slate-400">/</span> {school.student_count}
                                            </span>
                                            <p className="text-xs text-slate-400">Max: {school.max_students}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">Req: {school.total_requests || 0} hits</span>
                                                <span className="text-xs text-slate-500">DB: {(Number(school.database_footprint) || 0) + Number(school.student_count) + Number(school.teacher_count)} rows</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isExpired ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                                    <XCircle className="w-3.5 h-3.5" /> Expired
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    <CheckCircle className="w-3.5 h-3.5" /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {school.subscription_end_date
                                                    ? new Date(school.subscription_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '-'
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleExtendSubscription(school)}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                            >
                                                Perpanjang / Edit
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                            {schools.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Belum ada sekolah yang terdaftar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
