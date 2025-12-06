import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentNavbar from './StudentNavbar';

const StudentLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <StudentNavbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default StudentLayout;
