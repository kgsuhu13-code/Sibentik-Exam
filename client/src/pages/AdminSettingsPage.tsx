
import React, { useState } from 'react';
import { Save, User, Lock, ShieldAlert, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const AdminSettingsPage = () => {
    const [activeTab, setActiveTab] = useState('security');
    const [loading, setLoading] = useState(false);

    // Form States
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // --- MAINTENANCE LOGIC ---
    const [isMaintenance, setIsMaintenance] = useState(false);

    React.useEffect(() => {
        if (activeTab === 'system') {
            const fetchStatus = async () => {
                try {
                    const res = await api.get('/admin/system/status');
                    setIsMaintenance(res.data.status === 'maintenance');
                } catch (error) {
                    console.error('Failed to fetch system status', error);
                }
            };
            fetchStatus();
        }
    }, [activeTab]);

    const handleToggleMaintenance = async () => {
        const newValue = !isMaintenance;

        const result = await MySwal.fire({
            title: newValue ? 'Aktifkan Mode Maintenance?' : 'Matikan Mode Maintenance?',
            text: newValue
                ? "Semua user (kecuali Admin) akan diblokir dari sistem."
                : "Sistem akan kembali dapat diakses oleh semua user.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: newValue ? '#d33' : '#3085d6',
            confirmButtonText: newValue ? 'Ya, Blokir Akses!' : 'Ya, Buka Akses!'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                await api.post('/admin/system/maintenance', { enabled: newValue });
                setIsMaintenance(newValue);
                MySwal.fire('Berhasil', `Status sistem: ${newValue ? 'MAINTENANCE' : 'ACTIVE'}`, 'success');
            } catch (error) {
                MySwal.fire('Gagal', 'Terjadi kesalahan saat mengubah status sistem', 'error');
            } finally {
                setLoading(false);
            }
        }
    };
    // -------------------------

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            MySwal.fire('Error', 'Password baru dan konfirmasi tidak cocok', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            MySwal.fire('Error', 'Password minimal 6 karakter', 'error');
            return;
        }

        setLoading(true);
        try {
            // Note: We need to implement this endpoint in backend later if not exists
            // Or use a generic user update endpoint
            await api.put('/users/change-password', {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword
            });

            MySwal.fire('Berhasil', 'Password berhasil diperbarui', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            MySwal.fire('Gagal', error.response?.data?.message || 'Gagal mengganti password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Pengaturan Sistem</h1>
                <p className="text-slate-500 mt-1">Kelola preferensi akun dan keamanan sistem global.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <User className="w-4 h-4" />
                        Profil Admin
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Lock className="w-4 h-4" />
                        Keamanan
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <ShieldAlert className="w-4 h-4" />
                        System Control
                    </button>
                </div>

                <div className="p-8">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">
                                    A
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Administrator</h3>
                                    <p className="text-sm text-slate-500">Super Admin Access</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                                    <input
                                        type="text"
                                        value="admin"
                                        disabled
                                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Username tidak dapat diubah.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Kontak</label>
                                    <input
                                        type="email"
                                        placeholder="admin@sibentik.com"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Simpan Profil
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password Saat Ini</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password Baru</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Minimal 6 karakter"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Konfirmasi Password Baru</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ulangi password baru"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                                >
                                    {loading ? 'Menyimpan...' : (
                                        <>
                                            <CheckCircle className="w-4 h-4" /> Update Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* SYSTEM CONTROL TAB */}
                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-4">
                                <div className="text-yellow-600">
                                    <ShieldAlert className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-yellow-800">Maintenance Mode</h4>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Aktifkan mode ini untuk mencegah user (selain admin) login ke sistem. Gunakan saat melakukan update besar.
                                    </p>
                                    <div className="mt-4">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isMaintenance}
                                                onChange={handleToggleMaintenance}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                                            <span className="ml-3 text-sm font-medium text-slate-700">Aktifkan Maintenance</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSettingsPage;
