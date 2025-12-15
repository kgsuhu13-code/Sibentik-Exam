
import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl rounded-full mix-blend-screen animate-blob"></div>
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500 rounded-full blur-3xl rounded-full mix-blend-screen animate-blob animation-delay-2000"></div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/10 p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl z-10">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-yellow-500/20 rounded-full text-yellow-500 animate-pulse">
                        <AlertTriangle className="w-16 h-16" />
                    </div>
                </div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
                    SISTEM UNDER MAINTENANCE
                </h1>

                <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                    Maaf, server sedang dalam perbaikan berkala untuk meningkatkan performa.
                    <br />
                    Silakan coba akses kembali dalam 15-30 menit.
                </p>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm font-medium bg-slate-800/50 py-2 px-4 rounded-full inline-flex">
                    <Clock className="w-4 h-4" />
                    <span>Estimasi Selesai: Segera</span>
                </div>

                <div className="mt-8">
                    <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
                        Check Status
                    </button>
                </div>
            </div>

            <p className="mt-8 text-slate-600 text-sm">
                &copy; {new Date().getFullYear()} Sibentik Exam System
            </p>
        </div>
    );
};

export default MaintenancePage;
