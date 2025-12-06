import pool from '../config/db.js';

const addAdminRole = async () => {
    try {
        // Add 'admin' to user_role enum
        await pool.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';`);
        console.log('✅ Role admin berhasil ditambahkan ke enum user_role');

    } catch (error) {
        console.error('❌ Gagal menambahkan role admin:', error);
    } finally {
        pool.end();
    }
};

addAdminRole();
