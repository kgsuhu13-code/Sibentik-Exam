// src/services/api.ts
import axios from 'axios';

const api = axios.create({
    // Menggunakan URL Cloudflare Tunnel Backend yang Anda berikan
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Menambahkan Token secara otomatis ke setiap request jika ada
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor: Menangani Response Error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401: Unauthorized / Token Expired
        if (error.response && error.response.status === 401) {
            // Cek apakah bukan di halaman login agar tidak loop
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }

        // Handle 503: Maintenance Mode
        if (error.response && error.response.status === 503) {
            // Cek agar tidak redirect loop jika sudah di halaman maintenance
            if (window.location.pathname !== '/maintenance') {
                window.location.href = '/maintenance';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
