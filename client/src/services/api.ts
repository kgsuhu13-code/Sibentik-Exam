// src/services/api.ts
import axios from 'axios';

const api = axios.create({
    // Menggunakan URL Cloudflare Tunnel Backend yang Anda berikan
    baseURL: 'http://localhost:3000/api',
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

export default api;
