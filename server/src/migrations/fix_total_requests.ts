
import pool from '../config/db.js';

const runMigration = async () => {
    try {
        console.log('Adding total_requests column to schools table...');
        await pool.query(`
            ALTER TABLE schools 
            ADD COLUMN IF NOT EXISTS total_requests BIGINT DEFAULT 0;
        `);
        console.log('✅ Migration successful: total_requests column added.');
    } catch (error: any) {
        console.log('⚠️ Migration note:', error.message);
    } finally {
        // Jangan exit paksa agar pool bisa close gracefully jika perlu, atau exit manual
        process.exit(0);
    }
};

runMigration();
