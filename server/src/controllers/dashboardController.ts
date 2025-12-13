import type { Request, Response } from 'express';
import pool from '../config/db.js';
import redis from '../config/redis.js';

const DASHBOARD_CACHE_TTL = 300; // 5 minutes (300 seconds)

export const getTeacherDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const teacherId = (req as any).user?.id;
        const schoolId = (req as any).user?.school_id;

        if (!teacherId || !schoolId) {
            res.status(401).json({ message: 'Unauthorized or No School Assigned' });
            return;
        }

        const cacheKey = `dashboard:teacher:${teacherId}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            res.json(JSON.parse(cachedData));
            return;
        }

        // 1. ACTIVE EXAMS (Live Monitoring) - Filter by created_by AND school_id for total students
        // 1. LATEST EXAM ANALYSIS (Top 3 Students & Stats)
        const latestExamQuery = await pool.query(`
            SELECT 
                e.id, e.title, qb.subject, qb.class_level, e.end_time,
                AVG(es.score) as avg_score,
                MAX(es.score) as max_score,
                MIN(es.score) as min_score,
                (SELECT COUNT(*) FROM exam_sessions es2 WHERE es2.exam_id = e.id AND es2.score < 70) as remedial_count,
                (SELECT COUNT(*) FROM exam_sessions es3 WHERE es3.exam_id = e.id AND es3.status = 'completed') as total_participants
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            LEFT JOIN exam_sessions es ON es.exam_id = e.id
            WHERE e.created_by = $1 
            AND (e.end_time < (NOW() + INTERVAL '7 hours') OR EXISTS (SELECT 1 FROM exam_sessions es2 WHERE es2.exam_id = e.id AND es2.status = 'completed'))
            GROUP BY e.id, qb.subject, qb.class_level, e.end_time
            ORDER BY e.end_time DESC
            LIMIT 1
        `, [teacherId]);

        let topStudents: any[] = [];
        let latestExam = null; // No type defined yet, any is implicitly used or inferred

        if (latestExamQuery.rows.length > 0) {
            latestExam = latestExamQuery.rows[0];

            const topStudentsQuery = await pool.query(`
                SELECT u.full_name, es.score 
                FROM exam_sessions es
                JOIN users u ON es.student_id = u.id
                WHERE es.exam_id = $1 AND es.status = 'completed'
                ORDER BY es.score DESC
                LIMIT 3
            `, [latestExam.id]);

            topStudents = topStudentsQuery.rows;
        }

        // 2. ACTIVE EXAMS (Live - For Sidebar)
        const activeExamsQuery = await pool.query(`
            SELECT 
                e.id, e.title, e.end_time, qb.class_level, e.exam_token,
                (SELECT COUNT(*) FROM exam_sessions es WHERE es.exam_id = e.id AND es.status = 'completed') as submitted_count
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            WHERE e.created_by = $1 
            AND e.start_time <= (NOW() + INTERVAL '7 hours') 
            AND e.end_time >= (NOW() + INTERVAL '7 hours')
            ORDER BY e.end_time ASC
            LIMIT 5
        `, [teacherId]);

        // 3. UPCOMING EXAMS (Next 48 Hours) - No longer primary focus but kept or replaced?
        // Let's keep it but maybe we prioritize Active.
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
            AND e.start_time > (NOW() + INTERVAL '7 hours') 
            AND e.start_time <= (NOW() + INTERVAL '7 hours' + INTERVAL '48 hours')
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
            AND (SELECT COUNT(*) FROM exam_sessions es WHERE es.exam_id = e.id AND es.status = 'completed') > 0
            AND e.end_time > (NOW() + INTERVAL '7 hours' - INTERVAL '30 days')
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
            AND es.status = 'completed'
            GROUP BY e.id, e.title, qb.class_level, e.end_time
            ORDER BY e.end_time DESC
            LIMIT 4
        `, [teacherId]);

        // 5. QUICK STATS - Filter students by school_id
        const statsQuery = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'student' AND school_id = $2) as total_students,
                (SELECT COUNT(*) FROM question_banks WHERE created_by = $1) as total_banks
        `, [teacherId, schoolId]);

        const responseData = {
            latestExamAnalysis: {
                exam: latestExam,
                topStudents
            },
            activeExams: activeExamsQuery.rows,
            upcomingExams: upcomingExamsQuery.rows,
            gradingQueue: gradingQueueQuery.rows,
            recentPerformance: recentPerformanceQuery.rows,
            stats: statsQuery.rows[0]
        };

        await redis.setex(cacheKey, DASHBOARD_CACHE_TTL, JSON.stringify(responseData));

        res.json(responseData);

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Server Error fetching dashboard stats' });
    }
};
