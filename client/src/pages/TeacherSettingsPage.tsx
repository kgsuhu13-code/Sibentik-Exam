
import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Loader2, Shield } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const TeacherSettingsPage = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Profile Form
    const [profileForm, setProfileForm] = useState({
        full_name: '',
        username: '',
        role: '',
        school_id: ''
    });

    // Password Form
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setProfileForm({
                full_name: res.data.full_name || '',
                username: res.data.username || '',
                role: res.data.role,
                school_id: res.data.school_id
            });
        } catch (error) {
            console.error('Failed to fetch profile', error);
            toast.error('Gagal memuat profil');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/auth/update-profile', {
                full_name: profileForm.full_name
            });
            toast.success('Profil berhasil diperbarui!');
            // Update local storage if needed, but context usually handles this on refresh or re-fetch
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            toast.error('Konfirmasi password baru tidak cocok!');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            });
            toast.success('Password berhasil diubah! Silakan login ulang nanti.');
            setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Gagal mengubah password');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans text-slate-900 pb-10 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Pengaturan Akun</h1>
                <p className="text-slate-500 mt-1">Kelola informasi profil dan keamanan akun Anda.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'profile'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Profil Saya
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${activeTab === 'security'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        <Shield className="w-4 h-4" />
                        Keamanan
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Informasi Profil
                            </h2>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={profileForm.full_name}
                                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                                        placeholder="Nama Lengkap Anda"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                                    <input
                                        type="text"
                                        value={profileForm.username}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                        placeholder="Username Login"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Username tidak dapat diubah. Hubungi admin untuk perubahan.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Peran (Role)</label>
                                        <input
                                            type="text"
                                            value={profileForm.role === 'teacher' ? 'Guru / Pengajar' : profileForm.role}
                                            disabled
                                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">ID Sekolah</label>
                                        <input
                                            type="text"
                                            value={profileForm.school_id || '-'}
                                            disabled
                                            className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-600" />
                                Ganti Password
                            </h2>

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Password Saat Ini</label>
                                    <input
                                        type="password"
                                        value={passwordForm.oldPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        placeholder="Masukkan password lama"
                                        required
                                    />
                                </div>

                                <div className="border-t border-slate-100 my-4 pt-4">
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Password Baru</label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Minimal 6 karakter"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmNewPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            placeholder="Ulangi password baru"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherSettingsPage;
