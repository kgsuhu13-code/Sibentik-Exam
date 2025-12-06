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

        // 3. Buat Token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name,
                class_level: user.class_level // Return class_level on login too
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
            'SELECT id, username, full_name, role, class_level FROM users WHERE id = $1',
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