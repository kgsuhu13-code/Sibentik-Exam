import pool from '../config/db.js';
import bcrypt from 'bcrypt';

const createStudent = async () => {
    try {
        const username = 'siswa2';
        const password = 'siswa2';
        const fullName = 'Asep Sunandar';
        const role = 'student';
        const classLevel = '10';

        // Cek apakah user sudah ada
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            console.log('⚠️ User siswa1 sudah ada.');
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        await pool.query(
            `INSERT INTO users (username, password_hash, full_name, role, class_level) 
             VALUES ($1, $2, $3, $4, $5)`,
            [username, hashedPassword, fullName, role, classLevel]
        );

        console.log('✅ Akun siswa berhasil dibuat:');
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log(`   Nama: ${fullName}`);
        console.log(`   Kelas: ${classLevel}`);

    } catch (error) {
        console.error('❌ Gagal membuat akun siswa:', error);
    } finally {
        pool.end();
    }
};

createStudent();
