import pool from '../config/db.js';
import bcrypt from 'bcrypt';

const seedStudents = async () => {
    try {
        const students = [
            {
                username: 'siswa2',
                password: 'password123',
                full_name: 'Siti Aminah',
                class_level: '10'
            },
            {
                username: 'siswa3',
                password: 'password123',
                full_name: 'Doni Pratama',
                class_level: '10'
            }
        ];

        console.log('Mulai membuat akun siswa tambahan...');

        for (const student of students) {
            const hashedPassword = await bcrypt.hash(student.password, 10);

            try {
                await pool.query(
                    `INSERT INTO users (username, password_hash, full_name, role, class_level) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [student.username, hashedPassword, student.full_name, 'student', student.class_level]
                );
                console.log(`✅ Berhasil membuat akun: ${student.username} (${student.full_name})`);
            } catch (err: any) {
                if (err.code === '23505') { // Unique violation
                    console.log(`⚠️ Akun ${student.username} sudah ada, melewati...`);
                } else {
                    console.error(`❌ Gagal membuat ${student.username}:`, err.message);
                }
            }
        }

        console.log('Selesai.');
        process.exit(0);
    } catch (error) {
        console.error('Script error:', error);
        process.exit(1);
    }
};

seedStudents();
