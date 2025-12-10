
import pool from '../config/db';

const alterPointsColumn = async () => {
    try {
        console.log('Altering questions table...');

        // Ubah kolom points menjadi DECIMAL(5,2) agar bisa menyimpan nilai seperti 3.33
        // DECIMAL(5,2) artinya total 5 digit, dengan 2 digit di belakang koma (maks 999.99)
        await pool.query(`
            ALTER TABLE questions 
            ALTER COLUMN points TYPE DECIMAL(5,2);
        `);

        console.log('Successfully altered points column to DECIMAL(5,2)');
        process.exit(0);
    } catch (error) {
        console.error('Error altering table:', error);
        process.exit(1);
    }
};

alterPointsColumn();
