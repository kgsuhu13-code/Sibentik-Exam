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
});

pool.on('connect', () => {
    console.log('✅ Terhubung ke Neon PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Error koneksi database:', err);
});

export default pool;