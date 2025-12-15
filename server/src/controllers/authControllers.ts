// src/controllers/authController.ts
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// --- REGISTER ---
export const register = async (req: Request, res: Response): Promise<void> => {
    const { username, password, full_name, role, class_level } = req.body;

    try {
        // 1. Cek apakah username sudah ada
        const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            res.status(400).json({ message: 'Username sudah digunakan!' });
            return;
        }

        // 2. Enkripsi Password (Hashing)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Simpan ke Database
        // Note: For now, new users might not have a school_id unless assigned later or passed in registration.
        // We'll assume they get assigned to a default school or NULL for now.
        const newUser = await pool.query(
            `INSERT INTO users (username, password_hash, full_name, role, class_level) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, username, role, class_level`,
            [username, hashedPassword, full_name, role, class_level || null]
        );

        res.status(201).json({ message: 'Registrasi berhasil', user: newUser.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// --- LOGIN ---
export const login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    try {
        // 1. Cari User
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            res.status(400).json({ message: 'Username atau password salah' });
            return;
        }

        const user = result.rows[0];

        // 2. Cek Password (Bandingkan input dengan hash di DB)
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            res.status(400).json({ message: 'Username atau password salah' });
            return;
        }

        // 2.5. Cek Status Langganan Sekolah (Jika bukan super admin)
        if (user.role !== 'admin' && user.school_id) {
            const schoolRes = await pool.query('SELECT subscription_end_date, subscription_status FROM schools WHERE id = $1', [user.school_id]);

            if (schoolRes.rows.length > 0) {
                const school = schoolRes.rows[0];
                const now = new Date();

                // Cek Status Eksplisit
                if (school.subscription_status && school.subscription_status !== 'active') {
                    res.status(403).json({ message: 'Akun sekolah Anda dinonaktifkan. Hubungi Admin Sibentik.' });
                    return;
                }

                // Cek Tanggal Expired
                if (school.subscription_end_date && new Date(school.subscription_end_date) < now) {
                    res.status(403).json({ message: 'Masa berlangganan sekolah telah habis. Hubungi Admin Sibentik untuk perpanjangan.' });
                    return;
                }
            }
        }

        // 3. Buat Token JWT
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                username: user.username,
                school_id: user.school_id
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        // [BARU] Catat waktu login terakhir
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                class_level: user.class_level,
                school_id: user.school_id
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
};

// --- GET ME (PROFILE) ---
export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const result = await pool.query(
            'SELECT id, username, full_name, role, class_level, school_id FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'User tidak ditemukan' });
            return;
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil profil' });
    }
};

// --- UPDATE PROFILE ---
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { full_name } = req.body;

    try {
        const result = await pool.query(
            `UPDATE users 
             SET full_name = COALESCE($1, full_name)
             WHERE id = $2 RETURNING id, username, full_name, role`,
            [full_name, userId]
        );

        res.json({ message: 'Profil berhasil diperbarui', user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memperbarui profil' });
    }
};

// --- CHANGE PASSWORD ---
export const changePassword = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id;
    const { oldPassword, newPassword } = req.body;

    try {
        // 1. Ambil hash password lama
        const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) {
            res.status(404).json({ message: 'User tidak ditemukan' });
            return;
        }
        const currentHash = userRes.rows[0].password_hash;

        // 2. Verifikasi Password Lama
        const isMatch = await bcrypt.compare(oldPassword, currentHash);
        if (!isMatch) {
            res.status(400).json({ message: 'Password lama salah' });
            return;
        }

        // 3. Hash Password Baru
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        // 4. Update
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

        res.json({ message: 'Password berhasil diubah' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengubah password' });
    }
};