
import pool from '../config/db';

const addLastLoginColumn = async () => {
    try {
        console.log('Adding last_login column to users table...');

        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        `);

        console.log('Successfully added last_login column.');
        process.exit(0);
    } catch (error) {
        console.error('Error adding column:', error);
        process.exit(1);
    }
};

addLastLoginColumn();
