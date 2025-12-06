import React from 'react';
import { Users, Database, Server, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Pusat kontrol sistem CBT Sibentik.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    System Online
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total User</p>
                            <h3 className="text-2xl font-bold text-slate-800">-</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Soal</p>
                            <h3 className="text-2xl font-bold text-slate-800">-</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Server Load</p>
                            <h3 className="text-2xl font-bold text-slate-800">Optimal</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Security</p>
                            <h3 className="text-2xl font-bold text-slate-800">Aman</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Aksi Cepat</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                            <span className="font-bold text-slate-700 block mb-1">Tambah Siswa</span>
                            <span className="text-xs text-slate-500">Import data siswa baru</span>
                        </button>
                        <button className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
                            <span className="font-bold text-slate-700 block mb-1">Tambah Guru</span>
                            <span className="text-xs text-slate-500">Buat akun pengajar baru</span>
                        </button>
                        <button className="p-4 border border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all text-left">
                            <span className="font-bold text-slate-700 block mb-1">Reset Login</span>
                            <span className="text-xs text-slate-500">Logout paksa user</span>
                        </button>
                        <button className="p-4 border border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
                            <span className="font-bold text-slate-700 block mb-1">Backup Data</span>
                            <span className="text-xs text-slate-500">Download database SQL</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4">Log Aktivitas Sistem</h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 mt-1.5 bg-slate-300 rounded-full"></div>
                            <div>
                                <p className="text-slate-700"><span className="font-bold">System</span> memulai layanan.</p>
                                <p className="text-xs text-slate-400">Baru saja</p>
                            </div>
                        </div>
                        {/* Dummy logs */}
                        <div className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 mt-1.5 bg-blue-300 rounded-full"></div>
                            <div>
                                <p className="text-slate-700"><span className="font-bold">Pak Budi</span> membuat ujian baru.</p>
                                <p className="text-xs text-slate-400">10 menit yang lalu</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
