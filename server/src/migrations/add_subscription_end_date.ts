
import pool from '../config/db.js';

const addSubscriptionEndDate = async () => {
    try {
        await pool.query(`
            ALTER TABLE schools 
            ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
        `);

        // Set default text for existing rows regarding subscription
        // For example, set to 1 year from now for all existing active schools
        await pool.query(`
            UPDATE schools 
            SET subscription_end_date = NOW() + INTERVAL '1 year'
            WHERE subscription_end_date IS NULL;
        `);

        console.log('✅ Kolom subscription_end_date berhasil ditambahkan');
    } catch (error) {
        console.error('❌ Gagal menambahkan subscription_end_date:', error);
    } finally {
        pool.end();
    }
};

addSubscriptionEndDate();
