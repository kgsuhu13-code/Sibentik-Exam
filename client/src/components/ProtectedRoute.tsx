import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: ('teacher' | 'student')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Jika role tidak sesuai, redirect ke halaman yang sesuai role-nya
        if (user.role === 'teacher') {
            return <Navigate to="/teacher-dashboard" replace />;
        } else {
            return <Navigate to="/exam" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
