import type { Request, Response } from 'express';
import pool from '../config/db.js';

// Get Monitoring Data (Optimized for Scale)
export const getExamMonitorData = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params; // exam_id

    try {
        // 1. Get Exam Details
        const examResult = await pool.query(`
            SELECT e.title, e.exam_token, e.created_by, e.is_published, e.bank_id, qb.class_level 
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            WHERE e.id = $1
        `, [id]);

        if (examResult.rows.length === 0) {
            res.status(404).json({ message: 'Ujian tidak ditemukan' });
            return;
        }
        const exam = examResult.rows[0];

        // 1.5 Fetch Answer Keys (Untuk Hitung Benar/Salah Realtime)
        const keysResult = await pool.query(`
            SELECT id, correct_answer, type FROM questions 
            WHERE bank_id = $1
        `, [exam.bank_id]);
        const questionKeys = keysResult.rows;

        // Mapping Class Level if needed (simplified for SQL array)
        const classMapping: Record<string, string[]> = {
            'X': ['X', '10'], '10': ['X', '10'],
            'XI': ['XI', '11'], '11': ['XI', '11'],
            'XII': ['XII', '12'], '12': ['XII', '12']
        };
        const validClasses = classMapping[exam.class_level] || [exam.class_level];

        // 2. Fetch All Students & Session Data in ONE Query using LEFT JOIN
        const query = `
            SELECT 
                u.id as student_id, 
                u.full_name as student_name, 
                u.username,
                COALESCE(es.status, 'not_started') as status,
                es.start_time,
                es.end_time,
                es.current_question_index,
                COALESCE(es.score, 0) as score,
                es.is_locked,
                COALESCE(es.violation_count, 0) as violation_count,
                es.violation_log,
                es.answers,  -- Perlu untuk hitung statistik
                (SELECT COUNT(*) FROM questions WHERE bank_id = (SELECT bank_id FROM exams WHERE id = $1)) as total_questions
            FROM users u
            LEFT JOIN exam_sessions es ON u.id = es.student_id AND es.exam_id = $1
            WHERE u.role = 'student' AND u.class_level = ANY($2)
            ORDER BY u.full_name ASC
        `;

        const studentsResult = await pool.query(query, [id, validClasses]);
        const students = studentsResult.rows;

        // Process data formatting
        const monitorData = students.map(row => {
            // Convert timestamps to ISO if exist
            const startTime = row.start_time ? new Date(row.start_time).toISOString() : null;
            const endTime = row.end_time ? new Date(row.end_time).toISOString() : null;

            // Hitung Statistik Jawaban
            let correct = 0;
            let wrong = 0;
            let unanswered = 0;
            let essayAnswered = 0;
            let essayTotal = 0;

            const answers = row.answers || {};

            questionKeys.forEach(q => {
                const ans = answers[q.id];

                if (q.type === 'essay') {
                    essayTotal++;
                    if (ans && ans.trim().length > 0) essayAnswered++;
                } else {
                    // Multiple Choice
                    if (!ans) {
                        unanswered++;
                    } else if (ans === q.correct_answer) {
                        correct++;
                    } else {
                        wrong++;
                    }
                }
            });

            return {
                student_id: row.student_id,
                student_name: row.student_name,
                username: row.username,
                status: row.status,
                start_time: startTime,
                end_time: endTime,
                current_question: (row.current_question_index || 0) + 1,
                score: parseFloat(row.score),
                correct_count: correct,
                wrong_count: wrong,
                unanswered_count: unanswered,
                is_locked: row.is_locked || false,
                violation_count: parseInt(row.violation_count),
                violation_log: row.violation_log || [],
                essay_stats: { answered: essayAnswered, total: essayTotal }
            };
        });

        const startedCount = monitorData.filter(s => s.status !== 'not_started').length;
        const finishedCount = monitorData.filter(s => s.status === 'completed').length;

        res.json({
            exam_title: exam.title,
            exam_token: exam.exam_token,
            is_published: exam.is_published,
            created_by: exam.created_by,
            class_level: exam.class_level,
            total_students: students.length,
            started_count: startedCount,
            finished_count: finishedCount,
            students: monitorData
        });

    } catch (error) {
        console.error('Monitoring Error:', error);
        res.status(500).json({ message: 'Gagal mengambil data monitoring' });
    }
};

// Force Finish Exam (Paksa Selesai)
export const forceFinishExam = async (req: Request, res: Response): Promise<void> => {
    const { examId, studentId } = req.params;

    try {
        const sessionResult = await pool.query(
            'SELECT * FROM exam_sessions WHERE exam_id = $1 AND student_id = $2',
            [examId, studentId]
        );

        if (sessionResult.rows.length === 0) {
            res.status(404).json({ message: 'Sesi ujian tidak ditemukan' });
            return;
        }

        const session = sessionResult.rows[0];

        if (session.status === 'completed') {
            res.json({ message: 'Ujian sudah selesai' });
            return;
        }

        let finalScore = 0;
        let scoresDetail: Record<string, number> = {};
        const answers = session.answers || {};

        const examRes = await pool.query('SELECT bank_id FROM exams WHERE id = $1', [examId]);
        if (examRes.rows.length > 0) {
            const bankId = examRes.rows[0].bank_id;
            const questionsRes = await pool.query('SELECT id, type, correct_answer, points FROM questions WHERE bank_id = $1', [bankId]);
            const questions = questionsRes.rows;

            questions.forEach(q => {
                const studentAns = answers[q.id];
                if (q.type !== 'essay' && studentAns && studentAns === q.correct_answer) {
                    const points = parseFloat(q.points) || 0;
                    finalScore += points;
                    scoresDetail[q.id] = points;
                } else {
                    scoresDetail[q.id] = 0;
                }
            });
        }

        await pool.query(
            `UPDATE exam_sessions 
             SET status = 'completed', 
                 end_time = NOW(),
                 score = $1,
                 scores = $2
             WHERE exam_id = $3 AND student_id = $4`,
            [finalScore, JSON.stringify(scoresDetail), examId, studentId]
        );

        res.json({ message: 'Ujian berhasil dipaksa selesai', finalScore });

    } catch (error) {
        console.error('Gagal memaksa selesai ujian:', error);
        res.status(500).json({ message: 'Gagal memproses permintaan' });
    }
};
