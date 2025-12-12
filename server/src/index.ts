// src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import examRoutes from './routes/examRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import classRoutes from './routes/classRoutes.js';
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
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
import uploadRoutes from './routes/uploadRoutes.js';
app.use('/api/upload', uploadRoutes);

// Static Folder untuk Gambar
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve uploads folder. Note: we go up one level from 'src' (dist/src -> dist/..) or just root depending on how it's run.
// Assuming 'uploads' is in project root.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Init DB (Temporary Fix for Migration)
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exams (
                id SERIAL PRIMARY KEY,
                bank_id INTEGER REFERENCES question_banks(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                duration INTEGER NOT NULL,
                exam_token VARCHAR(10) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS exam_participants (
                id SERIAL PRIMARY KEY,
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(exam_id, student_id)
            );

            ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

            -- Migrasi Timezone: Ubah TIMESTAMP biasa menjadi TIMESTAMPTZ
            ALTER TABLE exams 
            ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
            ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC';
            
            -- Pastikan tabel exam_sessions juga menggunakan TIMESTAMPTZ jika ada waktu
            ALTER TABLE exam_sessions 
            ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC',
            ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'UTC';
        `);
        console.log('✅ Tabel exams berhasil dibuat/verifikasi');
    } catch (error) {
        console.error('❌ Gagal init DB:', error);
    }
};

initDb();

// Serve Frontend (Production Mode)
// Di Google Cloud, kita akan copy build frontend ke folder 'public'
const clientBuildPath = path.join(process.cwd(), 'public');
app.use(express.static(clientBuildPath));

// SPA Fallback: Any route not handled by API will serve index.html
app.get(/.*/, (req, res) => {
    // Cek apakah request ditujukan untuk API tapi tidak ada route-nya (404 API)
    if (req.path.startsWith('/api')) {
        res.status(404).json({ message: 'API Endpoint not found' });
        return;
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
