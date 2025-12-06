import pool from '../config/db.js';

const createExamsTable = async () => {
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
        console.log('✅ Tabel exams berhasil dibuat');
    } catch (error) {
        console.error('❌ Gagal membuat tabel exams:', error);
    } finally {
        pool.end();
    }
};

createExamsTable();
