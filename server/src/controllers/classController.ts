import type { Request, Response } from 'express';
import pool from '../config/db.js';

export const getClasses = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolId = (req as any).user?.school_id;

        if (!schoolId) {
            res.status(400).json({ message: 'School ID not found' });
            return;
        }

        const query = `
            SELECT DISTINCT class_level 
            FROM users 
            WHERE school_id = $1 
            AND role = 'student' 
            AND class_level IS NOT NULL 
            AND class_level != ''
            ORDER BY class_level ASC
        `;

        const result = await pool.query(query, [schoolId]);

        const classes = result.rows.map(r => r.class_level);
        res.json(classes);

    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getStudentsByClass = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolId = (req as any).user?.school_id;
        const { class_level } = req.query;

        if (!schoolId) {
            res.status(400).json({ message: 'School ID not found' });
            return;
        }

        if (!class_level) {
            res.status(400).json({ message: 'Class level is required' });
            return;
        }

        const result = await pool.query(`
            SELECT id, full_name, username 
            FROM users 
            WHERE school_id = $1 AND role = 'student' AND class_level = $2
            ORDER BY full_name ASC
        `, [schoolId, class_level]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
