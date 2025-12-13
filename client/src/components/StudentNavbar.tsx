
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ListTodo, History, User, LogOut } from 'lucide-react';
import { showConfirm } from '../utils/alert';

const StudentNavbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const result = await showConfirm(
            'Keluar?',
            "Apakah Anda yakin ingin keluar?",
            'Ya, Keluar',
            'Batal',
            'question',
            'danger'
        );

        if (result.isConfirmed) {
            logout();
            navigate('/login');
        }
    };

    const navItems = [
        { label: 'Dashboard', path: '/student-dashboard', icon: LayoutDashboard },
        { label: 'Ujian', path: '/student-exams', icon: ListTodo },
        { label: 'Riwayat', path: '/student-history', icon: History },
    ];

    return (
        <>
            {/* DESKTOP TOP NAVBAR (Hidden on Mobile) */}
            <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
                            <span className="text-xl font-bold text-slate-800 tracking-tight">Sibentik Exam</span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="flex items-center space-x-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                        }`
                                    }
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-800">{user?.username}</p>
                                    <p className="text-xs text-slate-500">Siswa</p>
                                </div>
                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-600">
                                    <User className="w-5 h-5" />
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Keluar"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* MOBILE TOP BAR (Logo only) */}
            <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white" />
                    <span className="font-bold text-slate-800">Sibentik Exam</span>
                </div>
                {/* Logout button removed as requested */}
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 pb-safe">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </>
    );
};

export default StudentNavbar;
