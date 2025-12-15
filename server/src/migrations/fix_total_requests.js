
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const runMigration = async () => {
    try {
        console.log('Adding total_requests column to schools table...');
        await pool.query(`
            ALTER TABLE schools 
            ADD COLUMN IF NOT EXISTS total_requests BIGINT DEFAULT 0;
        `);
        console.log('✅ Migration successful: total_requests column added.');
    } catch (error) {
        console.log('⚠️ Migration note:', error.message);
    } finally {
        await pool.end();
    }
};

runMigration();
