// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import examRoutes from './routes/examRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import pool from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Agar frontend bisa akses backend
app.use(express.json()); // Agar bisa baca format JSON

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Init DB (Temporary Fix for Migration)
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exams (
                id SERIAL PRIMARY KEY,
                bank_id INTEGER REFERENCES question_banks(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                duration INTEGER NOT NULL,
                exam_token VARCHAR(10) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabel exams berhasil dibuat/verifikasi');
    } catch (error) {
        console.error('❌ Gagal init DB:', error);
    }
};

initDb();

// Jalankan Server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
