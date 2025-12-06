import type { Request, Response } from 'express';
import pool from '../config/db.js';

// Helper: Get User ID from Request
const getUserId = (req: Request): number | null => {
    return (req as any).user?.id || null;
};

export const getExams = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, scope } = req.query;
        const userId = getUserId(req);

        let query = `
            SELECT e.*, qb.title as bank_title, qb.subject, qb.class_level 
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
        `;

        const params: any[] = [];

        if (studentId) {
            // 1. Get Student Class Level
            const studentResult = await pool.query('SELECT class_level FROM users WHERE id = $1', [studentId]);
            const studentClass = studentResult.rows[0]?.class_level;

            // Student View: Filter by class level
            query = `
                SELECT e.*, qb.title as bank_title, qb.subject, qb.class_level,
                       es.status as student_status, es.start_time as student_start_time
                FROM exams e
                JOIN question_banks qb ON e.bank_id = qb.id
                LEFT JOIN exam_sessions es ON e.id = es.exam_id AND es.student_id = $1
            `;
            params.push(studentId);
            // params.push(studentClass);
        } else {
            // Teacher View
            if (scope === 'all') {
                // Return ALL exams for monitoring purposes (Cross-Proctoring)
                // No filter by created_by
            } else if (userId) {
                // Default: See ONLY their own exams (My Exams)
                query += ` WHERE e.created_by = $1`;
                params.push(userId);
            }
        }

        query += ` ORDER BY e.start_time DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil jadwal ujian' });
    }
};

export const createExam = async (req: Request, res: Response): Promise<void> => {
    const { bank_id, title, start_time, end_time, duration, exam_token } = req.body;
    const created_by = getUserId(req);

    try {
        // Verify bank ownership or allow usage?
        // Requirement: "yang bukan pembuat hanya bisa menggunakan bank soal tersebut"
        // So we don't need to check bank ownership here, just allow usage.

        const result = await pool.query(
            `INSERT INTO exams (bank_id, title, start_time, end_time, duration, exam_token, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [bank_id, title, start_time, end_time, duration, exam_token, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat jadwal ujian' });
    }
};

export const deleteExam = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    try {
        // Check ownership
        const check = await pool.query('SELECT created_by FROM exams WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            res.status(404).json({ message: 'Jadwal ujian tidak ditemukan' });
            return;
        }

        if (check.rows[0].created_by && check.rows[0].created_by !== userId) {
            res.status(403).json({ message: 'Anda tidak memiliki izin menghapus jadwal ujian ini' });
            return;
        }

        await pool.query('DELETE FROM exams WHERE id = $1', [id]);
        res.json({ message: 'Jadwal ujian berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus jadwal ujian' });
    }
};
