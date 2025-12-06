import pool from '../config/db.js';
import bcrypt from 'bcrypt';

const createAdmin = async () => {
    try {
        const username = 'admin';
        const password = 'admin123';
        const fullName = 'Administrator';
        const role = 'admin';

        // Cek apakah user sudah ada
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            console.log('⚠️ User admin sudah ada.');
            // Optional: Update password if needed
            // const salt = await bcrypt.genSalt(10);
            // const hashedPassword = await bcrypt.hash(password, salt);
            // await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashedPassword, username]);
            // console.log('✅ Password admin direset ke admin123');
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        await pool.query(
            `INSERT INTO users (username, password_hash, full_name, role) 
             VALUES ($1, $2, $3, $4)`,
            [username, hashedPassword, fullName, role]
        );

        console.log('✅ Akun admin berhasil dibuat:');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role: ${role}`);

    } catch (error) {
        console.error('❌ Gagal membuat akun admin:', error);
    } finally {
        pool.end();
    }
};

createAdmin();
