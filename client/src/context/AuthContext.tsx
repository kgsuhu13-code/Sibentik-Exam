// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';


// Tipe data User
interface User {
    id: number;
    username: string;
    role: 'teacher' | 'student';
}

// Tipe data Context
interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Cek saat aplikasi pertama kali dimuat (Reload page)
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('role');
        const storedUser = localStorage.getItem('username');
        const storedId = localStorage.getItem('id');

        if (storedToken && storedRole && storedUser) {
            setToken(storedToken);
            setUser({
                id: storedId ? parseInt(storedId) : 0,
                username: storedUser,
                role: storedRole as 'teacher' | 'student'
            });
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('id', userData.id.toString());

        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('id');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }
        }>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook biar gampang dipanggil
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};