import type { Request, Response } from 'express';
import pool from '../config/db.js';

export const getTeacherDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const teacherId = (req as any).user?.id;

        if (!teacherId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        // 1. ACTIVE EXAMS (Live Monitoring) - Filter by created_by
        const activeExamsQuery = await pool.query(`
            SELECT 
                e.id, 
                e.title, 
                e.end_time,
                qb.class_level,
                qb.subject,
                (SELECT COUNT(*) FROM exam_sessions es WHERE es.exam_id = e.id AND es.status = 'completed') as submitted_count,
                (
                    SELECT COUNT(*) 
                    FROM users u 
                    WHERE u.role = 'student' 
                    AND (
                        -- Cocokkan persis (case insensitive & trim)
                        TRIM(LOWER(u.class_level)) = TRIM(LOWER(qb.class_level))
                        -- ATAU cocokkan variasi umum (X=10, XI=11, XII=12)
                        OR (TRIM(LOWER(qb.class_level)) IN ('x', '10') AND TRIM(LOWER(u.class_level)) IN ('x', '10'))
                        OR (TRIM(LOWER(qb.class_level)) IN ('xi', '11') AND TRIM(LOWER(u.class_level)) IN ('xi', '11'))
                        OR (TRIM(LOWER(qb.class_level)) IN ('xii', '12') AND TRIM(LOWER(u.class_level)) IN ('xii', '12'))
                    )
                ) as total_students
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            WHERE e.created_by = $1 
            AND e.start_time <= NOW() AND e.end_time >= NOW()
            ORDER BY e.end_time ASC
        `, [teacherId]);

        // 2. UPCOMING EXAMS (Next 48 Hours) - Filter by created_by
        const upcomingExamsQuery = await pool.query(`
            SELECT 
                e.id, 
                e.title, 
                e.start_time,
                qb.class_level,
                qb.subject,
                e.exam_token
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            WHERE e.created_by = $1
            AND e.start_time > NOW() AND e.start_time <= NOW() + INTERVAL '48 hours'
            ORDER BY e.start_time ASC
            LIMIT 5
        `, [teacherId]);

        // 3. NEED GRADING - Filter by created_by
        const gradingQueueQuery = await pool.query(`
            SELECT DISTINCT
                e.id,
                e.title,
                e.end_time,
                qb.class_level,
                (SELECT COUNT(*) FROM exam_sessions es WHERE es.exam_id = e.id AND es.status = 'completed') as submission_count
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            JOIN questions q ON q.bank_id = qb.id
            WHERE e.created_by = $1
            AND e.end_time < NOW() 
            AND e.end_time > NOW() - INTERVAL '7 days'
            AND q.type = 'essay'
            LIMIT 5
        `, [teacherId]);

        // 4. RECENT PERFORMANCE - Filter by created_by
        const recentPerformanceQuery = await pool.query(`
            SELECT 
                e.title,
                qb.class_level,
                AVG(es.score) as avg_score,
                MAX(es.score) as max_score,
                MIN(es.score) as min_score,
                COUNT(es.id) as participant_count
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            JOIN exam_sessions es ON es.exam_id = e.id
            WHERE e.created_by = $1
            AND e.end_time < NOW() AND es.status = 'completed'
            GROUP BY e.id, e.title, qb.class_level, e.end_time
            ORDER BY e.end_time DESC
            LIMIT 4
        `, [teacherId]);

        // 5. QUICK STATS - Filter banks by created_by (Students remain global)
        const statsQuery = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
                (SELECT COUNT(*) FROM question_banks WHERE created_by = $1) as total_banks
        `, [teacherId]);

        res.json({
            activeExams: activeExamsQuery.rows,
            upcomingExams: upcomingExamsQuery.rows,
            gradingQueue: gradingQueueQuery.rows,
            recentPerformance: recentPerformanceQuery.rows,
            stats: statsQuery.rows[0]
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server Error fetching dashboard stats' });
    }
};
