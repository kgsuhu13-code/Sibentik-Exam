import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, User } from 'lucide-react';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-40 shadow-sm">
            {/* Left Side (Breadcrumb or Title - Optional) */}
            <div>
                <h2 className="text-slate-500 text-sm font-medium">
                    Selamat Datang, <span className="text-slate-800 font-bold">{user?.full_name || user?.username || 'Guru'}</span>
                </h2>
            </div>

            {/* Right Side (Profile & Notifications) */}
            <div className="flex items-center gap-6">
                <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-slate-800">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-slate-500 uppercase">{user?.role}</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                        <User className="w-5 h-5 text-slate-600" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
