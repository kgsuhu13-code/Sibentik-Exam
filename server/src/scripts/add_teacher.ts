import pool from '../config/db.js';
import bcrypt from 'bcrypt';

const createTeacher = async () => {
    try {
        const username = 'guru2';
        const password = 'guru123';
        const fullName = 'Budi Santoso, S.Pd';
        const role = 'teacher';

        // Cek apakah user sudah ada
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            console.log('⚠️ User guru2 sudah ada.');
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

        console.log('✅ Akun guru berhasil dibuat:');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log(`   Nama: ${fullName}`);

    } catch (error) {
        console.error('❌ Gagal membuat akun guru:', error);
    } finally {
        pool.end();
    }
};

createTeacher();
