import pool from '../config/db.js';

const debugData = async () => {
    try {
        console.log('--- DEBUG DATA ---');

        // 1. Check Exams and their Class Levels
        const exams = await pool.query(`
            SELECT e.id, e.title, qb.class_level 
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
        `);
        console.log('Exams:', exams.rows);

        // 2. Check Students and their Class Levels
        const students = await pool.query(`
            SELECT id, username, full_name, class_level 
            FROM users 
            WHERE role = 'student'
        `);
        console.log('Students:', students.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugData();
