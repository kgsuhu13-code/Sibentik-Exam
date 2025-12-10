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
        const { class_level, q } = req.query; // q for search

        if (!schoolId) {
            res.status(400).json({ message: 'School ID not found' });
            return;
        }

        let query = `
            SELECT 
                u.id, 
                u.full_name, 
                u.username, 
                u.class_level,
                COALESCE(ROUND(AVG(es.score), 1), 0) as avg_score
            FROM users u
            LEFT JOIN exam_sessions es ON u.id = es.student_id AND es.status = 'completed'
            WHERE u.school_id = $1 AND u.role = 'student'
        `;
        const params: any[] = [schoolId];

        if (class_level && class_level !== 'all') {
            query += ` AND u.class_level = $${params.length + 1}`;
            params.push(class_level);
        }

        if (q) {
            query += ` AND (u.full_name ILIKE $${params.length + 1} OR u.username ILIKE $${params.length + 1})`;
            params.push(`%${q}%`);
        }

        query += ` GROUP BY u.id ORDER BY u.class_level ASC, u.full_name ASC`;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
