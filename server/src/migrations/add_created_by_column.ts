import pool from '../config/db.js';

const addCreatedByColumn = async () => {
    try {
        // 1. Add created_by to question_banks
        await pool.query(`
            ALTER TABLE question_banks 
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ Kolom created_by berhasil ditambahkan ke question_banks');

        // 2. Add created_by to exams
        await pool.query(`
            ALTER TABLE exams 
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('✅ Kolom created_by berhasil ditambahkan ke exams');

        // Optional: Set default owner for existing data (e.g., user_id 1)
        // This assumes user with ID 1 exists and is a teacher.
        // await pool.query('UPDATE question_banks SET created_by = 1 WHERE created_by IS NULL');
        // await pool.query('UPDATE exams SET created_by = 1 WHERE created_by IS NULL');

    } catch (error) {
        console.error('❌ Gagal menambahkan kolom created_by:', error);
    } finally {
        pool.end();
    }
};

addCreatedByColumn();
