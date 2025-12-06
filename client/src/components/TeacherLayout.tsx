import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

const TeacherLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <Navbar />

            <main className="pl-64 pt-16 min-h-screen transition-all duration-300">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default TeacherLayout;
