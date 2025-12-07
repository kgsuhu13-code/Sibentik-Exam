import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    CalendarDays,
    MonitorPlay,
    Users,
    FileBarChart,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher-dashboard' },
        { icon: BookOpen, label: 'Bank Soal', path: '/question-bank' },
        { icon: CalendarDays, label: 'Jadwal Ujian', path: '/exam-schedule' },
        { icon: MonitorPlay, label: 'Monitoring', path: '/monitoring' },
        { icon: Users, label: 'Data Siswa', path: '/students' },
        { icon: FileBarChart, label: 'Hasil & Nilai', path: '/grades' },
        { icon: Settings, label: 'Pengaturan', path: '/settings' },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 shadow-xl z-50">
            {/* Logo Area */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
                <span className="text-xl font-bold tracking-wide">Sibentik Exam</span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Keluar</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
