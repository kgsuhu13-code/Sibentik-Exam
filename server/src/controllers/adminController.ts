import type { Request, Response } from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

// --- DASHBOARD STATS ---
export const getAdminDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolId = (req as any).user?.school_id;
        const role = (req as any).user?.role;

        // Super Admin (no school_id) sees global stats
        if (role === 'admin' && !schoolId) {
            const globalStats = await pool.query(`
                SELECT 
                    (SELECT COUNT(*) FROM schools) as total_schools,
                    (SELECT COUNT(*) FROM users WHERE role != 'admin') as total_users,
                    (SELECT COUNT(*) FROM exams) as total_exams
            `);
            res.json(globalStats.rows[0]);
            return;
        }

        if (!schoolId) {
            res.status(400).json({ message: 'School ID not found for this admin.' });
            return;
        }

        // School Admin Stats
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'student') as total_students,
                (SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'teacher') as total_teachers,
                (SELECT COUNT(*) FROM question_banks WHERE school_id = $1) as total_banks,
                (SELECT COUNT(*) FROM exams WHERE school_id = $1 AND start_time <= NOW() AND end_time >= NOW()) as active_exams
        `, [schoolId]);

        res.json(stats.rows[0]);

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- USER MANAGEMENT ---

export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userRole = (req as any).user?.role;
        let schoolId = (req as any).user?.school_id;

        // If Super Admin, allow overriding schoolId via query param
        if (userRole === 'admin') {
            const querySchoolId = req.query.school_id;
            if (querySchoolId) {
                schoolId = querySchoolId;
            }
        }

        const { role, page = 1, limit = 10, search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        if (!schoolId) {
            res.status(400).json({ message: 'School ID required.' });
            return;
        }

        let query = `SELECT id, username, full_name, role, class_level, created_at FROM users WHERE school_id = $1`;
        const params: any[] = [schoolId];
        let paramIndex = 2;

        if (role) {
            query += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (search) {
            query += ` AND (username ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(Number(limit), offset);

        const users = await pool.query(query, params);

        // Count total for pagination
        let countQuery = `SELECT COUNT(*) FROM users WHERE school_id = $1`;
        const countParams: any[] = [schoolId];
        let countParamIndex = 2;

        if (role) {
            countQuery += ` AND role = $${countParamIndex}`;
            countParams.push(role);
            countParamIndex++;
        }
        if (search) {
            countQuery += ` AND (username ILIKE $${countParamIndex} OR full_name ILIKE $${countParamIndex})`;
            countParams.push(`%${search}%`);
        }

        const totalCount = await pool.query(countQuery, countParams);

        res.json({
            data: users.rows,
            total: Number(totalCount.rows[0].count),
            page: Number(page),
            totalPages: Math.ceil(Number(totalCount.rows[0].count) / Number(limit))
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const userRole = (req as any).user?.role;
        let schoolId = (req as any).user?.school_id;

        const { username, password, full_name, role, class_level, school_id: bodySchoolId } = req.body;

        // If Super Admin, allow overriding schoolId via body
        if (userRole === 'admin' && bodySchoolId) {
            schoolId = bodySchoolId;
        }

        if (!schoolId) {
            res.status(400).json({ message: 'School ID required.' });
            return;
        }

        // Check existing username
        const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (check.rows.length > 0) {
            res.status(400).json({ message: 'Username already exists.' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            `INSERT INTO users (username, password_hash, full_name, role, class_level, school_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [username, hashedPassword, full_name, role, class_level || null, schoolId]
        );

        res.status(201).json({ message: 'User created successfully' });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- SCHOOL MANAGEMENT ---

export const getSchools = async (req: Request, res: Response): Promise<void> => {
    try {
        // Only Super Admin can see all schools
        const role = (req as any).user?.role;
        if (role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const query = `
            SELECT 
                s.id, 
                s.name, 
                s.address, 
                s.subscription_status,
                s.max_students,
                (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'student') as student_count,
                (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher') as teacher_count,
                (SELECT COUNT(*) FROM exams e WHERE e.school_id = s.id AND e.start_time <= NOW() AND e.end_time >= NOW()) as active_exams
            FROM schools s
            ORDER BY s.id ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const createSchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, address, max_students, subscription_status } = req.body;
        const role = (req as any).user?.role;

        if (role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO schools (name, address, max_students, subscription_status)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, address, max_students || 1000, subscription_status || 'active']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating school:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- IMPORT STUDENTS ---

export const importStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolId = req.body.school_id;
        const file = (req as any).file;

        if (!schoolId) {
            res.status(400).json({ message: 'School ID is required' });
            return;
        }

        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        // Parse Excel
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Expected format: { username, password, full_name, class_level }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row of data as any[]) {
            const { username, password, full_name, class_level } = row;

            if (!username || !password || !full_name) {
                errorCount++;
                errors.push(`Row missing data: ${JSON.stringify(row)}`);
                continue;
            }

            try {
                // Check duplicate
                const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
                if (check.rows.length > 0) {
                    errorCount++;
                    errors.push(`Username ${username} already exists`);
                    continue;
                }

                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(String(password), salt);

                await pool.query(
                    `INSERT INTO users (username, password_hash, full_name, role, class_level, school_id)
                     VALUES ($1, $2, $3, 'student', $4, $5)`,
                    [username, hashedPassword, full_name, class_level || null, schoolId]
                );
                successCount++;
            } catch (err: any) {
                errorCount++;
                errors.push(`Failed to insert ${username}: ${err.message}`);
            }
        }

        res.json({
            message: 'Import process completed',
            successCount,
            errorCount,
            errors
        });

    } catch (error) {
        console.error('Error importing students:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const currentUserRole = (req as any).user?.role;
        const currentUserSchool = (req as any).user?.school_id;

        const userRes = await pool.query('SELECT role, school_id FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const targetUser = userRes.rows[0];

        if (currentUserRole !== 'admin') {
            if (String(targetUser.school_id) !== String(currentUserSchool)) {
                res.status(403).json({ message: 'Forbidden: Cannot delete user from another school' });
                return;
            }
        }

        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const deleteAllUsersBySchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const { schoolId } = req.params;
        const { role } = req.query;
        const currentUserRole = (req as any).user?.role;
        const currentUserSchool = (req as any).user?.school_id;

        if (currentUserRole !== 'admin') {
            if (String(schoolId) !== String(currentUserSchool)) {
                res.status(403).json({ message: 'Forbidden' });
                return;
            }
        }

        let query = 'DELETE FROM users WHERE school_id = $1';
        const params: any[] = [schoolId];

        if (role) {
            query += ' AND role = $2';
            params.push(role);
        } else {
            query += " AND role IN ('student', 'teacher')";
        }

        await pool.query(query, params);
        res.json({ message: 'All target users deleted successfully' });

    } catch (error) {
        console.error('Error deleting all users:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
