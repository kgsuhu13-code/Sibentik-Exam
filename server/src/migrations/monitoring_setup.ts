import pool from '../config/db.js';

const runMigrations = async () => {
    try {
        // 1. Add class_level to users
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS class_level VARCHAR(50);
        `);
        console.log('✅ Kolom class_level berhasil ditambahkan ke users');

        // 2. Create exam_sessions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exam_sessions (
                id SERIAL PRIMARY KEY,
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                current_question_index INTEGER DEFAULT 0,
                answers JSONB DEFAULT '{}', 
                status VARCHAR(20) DEFAULT 'ongoing', -- 'ongoing', 'completed'
                score DECIMAL(5,2) DEFAULT 0,
                UNIQUE(exam_id, student_id)
            );
        `);
        console.log('✅ Tabel exam_sessions berhasil dibuat');

    } catch (error) {
        console.error('❌ Gagal menjalankan migrasi monitoring:', error);
    } finally {
        pool.end();
    }
};

runMigrations();
