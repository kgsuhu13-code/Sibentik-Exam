import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ListTodo,
    History,
    LogOut,
    UserCircle,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudentSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const StudentSidebar = ({ isOpen = false, onClose }: StudentSidebarProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/student-dashboard' },
        { icon: ListTodo, label: 'Jadwal Ujian', path: '/student-exams' },
        { icon: History, label: 'Riwayat & Nilai', path: '/student-history' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col shadow-xl 
                transform transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static md:shadow-none md:h-screen
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Area */}
                <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-200" />
                        <span className="text-xl font-extrabold text-slate-800 tracking-tight">Sibentik <span className="text-blue-600">Exam</span></span>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Profile Summary */}
                <div className="px-6 py-6 pb-2">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.username || 'Siswa'}</p>
                            <p className="text-xs text-slate-500 truncate">Peserta Ujian</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu Utama</p>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose && onClose()}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600 font-medium'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                    <span className="font-semibold">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 bg-red-50 hover:bg-red-100/80 hover:text-red-600 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold">Keluar Aplikasi</span>
                    </button>
                    <p className="text-[10px] text-center text-slate-300 mt-4">v1.2.0 • Sibentik Exam</p>
                </div>
            </div>
        </>
    );
};

export default StudentSidebar;
