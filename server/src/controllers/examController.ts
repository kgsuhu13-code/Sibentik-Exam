import type { Request, Response } from 'express';
import pool from '../config/db.js';

// Helper: Get User ID from Request
const getUserId = (req: Request): number | null => {
    return (req as any).user?.id || null;
};

// Helper: Get User School ID from Request
const getUserSchoolId = (req: Request): number | null => {
    return (req as any).user?.school_id || null;
};

export const getExams = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, scope } = req.query;
        const userId = getUserId(req);
        const schoolId = getUserSchoolId(req);

        let query = '';
        const params: any[] = [];

        if (studentId) {
            // Student View: Only show exams from their own school
            // Using subquery to get student's school_id ensures security
            query = `
                SELECT e.*, qb.title as bank_title, qb.subject, qb.class_level,
                       es.status as student_status, es.start_time as student_start_time
                FROM exams e
                JOIN question_banks qb ON e.bank_id = qb.id
                JOIN users creator ON e.created_by = creator.id
                LEFT JOIN exam_sessions es ON e.id = es.exam_id AND es.student_id = $1
                LEFT JOIN exam_participants ep ON e.id = ep.exam_id AND ep.student_id = $1
                WHERE creator.school_id = (SELECT school_id FROM users WHERE id = $1)
                AND (
                    ep.student_id IS NOT NULL 
                    OR 
                    NOT EXISTS (SELECT 1 FROM exam_participants WHERE exam_id = e.id)
                )
            `;
            params.push(studentId);
        } else {
            // Teacher/Admin View
            query = `
                SELECT e.*, qb.title as bank_title, qb.subject, qb.class_level, u.full_name as creator_name
                FROM exams e
                JOIN question_banks qb ON e.bank_id = qb.id
                JOIN users u ON e.created_by = u.id
            `;

            // Enforce School Isolation
            if (schoolId) {
                query += ` WHERE u.school_id = $1`;
                params.push(schoolId);
            } else {
                // Fallback (should normally not happen if auth is correct)
                query += ` WHERE 1=0`;
            }

            // Scope Filtering
            if (scope !== 'all') {
                // Default: See ONLY their own exams (My Exams) unless querying 'all'
                query += ` AND e.created_by = $${params.length + 1}`;
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
    const { bank_id, title, start_time, end_time, duration, exam_token, student_ids } = req.body;
    const created_by = getUserId(req);

    try {
        const result = await pool.query(
            `INSERT INTO exams (bank_id, title, start_time, end_time, duration, exam_token, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [bank_id, title, start_time, end_time, duration, exam_token, created_by]
        );

        const examId = result.rows[0].id;

        // Insert Participants if provided
        if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
            // Generate placeholders ($1, $2), ($1, $3), ...
            // But simplify logic: loop insert or construct dynamic query
            // Constructing proper dynamic query:
            const values: string[] = [];
            const params: any[] = [examId];

            student_ids.forEach((sid: number, index: number) => {
                values.push(`($1, $${index + 2})`);
                params.push(sid);
            });

            const queryText = `INSERT INTO exam_participants (exam_id, student_id) VALUES ${values.join(',')}`;
            await pool.query(queryText, params);
        }

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

export const getExamGradesSummary = async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);

    try {
        const query = `
            SELECT 
                e.id, 
                e.title, 
                qb.subject,
                qb.class_level,
                e.start_time,
                e.end_time,
                e.exam_token,
                COUNT(es.id) as participant_count,
                COUNT(CASE WHEN es.status = 'completed' THEN 1 END) as finished_count,
                AVG(CASE WHEN es.status = 'completed' THEN es.score END) as avg_score,
                MAX(es.score) as max_score,
                MIN(es.score) as min_score
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            LEFT JOIN exam_sessions es ON es.exam_id = e.id
            WHERE e.created_by = $1
            GROUP BY e.id, qb.subject, qb.class_level, e.start_time, e.end_time
            ORDER BY e.start_time DESC
        `;

        const result = await pool.query(query, [userId]);

        // Convert numbers from string (Postgres aggregation returns strings)
        const formatted = result.rows.map(row => ({
            ...row,
            avg_score: row.avg_score ? Number(row.avg_score).toFixed(1) : 0,
            max_score: row.max_score ? Number(row.max_score) : 0,
            min_score: row.min_score ? Number(row.min_score) : 0,
            participant_count: Number(row.participant_count),
            finished_count: Number(row.finished_count)
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching exam grades summary:', error);
        res.status(500).json({ message: 'Gagal mengambil data nilai' });
    }
};
