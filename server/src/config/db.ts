// src/config/db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Cek apakah URL ada
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum diset di file .env');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // PENTING: Neon mewajibkan koneksi SSL
    ssl: true,
    max: 20, // Maksimal 20 koneksi di pool (Untuk handle ~500 siswa)
    idleTimeoutMillis: 30000, // Tutup koneksi nganggur setelah 30 detik
    connectionTimeoutMillis: 10000, // Batas waktu tunggu koneksi baru (10 detik)
});

pool.on('connect', () => {
    console.log('✅ Terhubung ke Neon PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Error koneksi database:', err);
});

export default pool;