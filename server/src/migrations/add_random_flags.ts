import pool from '../config/db.js';

const runMigration = async () => {
    try {
        console.log('Running migration: Adding random flags to question_banks...');

        await pool.query(`
            ALTER TABLE question_banks 
            ADD COLUMN IF NOT EXISTS is_random_question BOOLEAN DEFAULT FALSE;
        `);

        await pool.query(`
            ALTER TABLE question_banks 
            ADD COLUMN IF NOT EXISTS is_random_answer BOOLEAN DEFAULT FALSE;
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
