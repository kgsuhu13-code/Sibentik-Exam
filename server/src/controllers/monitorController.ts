import type { Request, Response } from 'express';
import pool from '../config/db.js';

// Get Monitoring Data
export const getExamMonitorData = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params; // exam_id

    try {
        // 1. Get Exam Details (to find class_level)
        const examResult = await pool.query(`
            SELECT e.*, qb.class_level 
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            WHERE e.id = $1
        `, [id]);

        if (examResult.rows.length === 0) {
            res.status(404).json({ message: 'Ujian tidak ditemukan' });
            return;
        }
        const exam = examResult.rows[0];

        const classLevel = exam.class_level;

        // 2. Get All Students in that Class
        const mapping: Record<string, string[]> = {
            'X': ['X', '10'],
            '10': ['X', '10'],
            'XI': ['XI', '11'],
            '11': ['XI', '11'],
            'XII': ['XII', '12'],
            '12': ['XII', '12']
        };

        const validClasses = mapping[classLevel] || [classLevel];

        const studentsResult = await pool.query(`
            SELECT id, full_name, username, class_level 
            FROM users 
            WHERE role = 'student' AND class_level = ANY($1)
            ORDER BY full_name ASC
        `, [validClasses]);

        const students = studentsResult.rows;

        // 3. Get Active Sessions for this Exam
        const sessionsResult = await pool.query(`
            SELECT *, 
            EXTRACT(EPOCH FROM start_time) * 1000 as start_time_epoch,
            EXTRACT(EPOCH FROM end_time) * 1000 as end_time_epoch
            FROM exam_sessions WHERE exam_id = $1
        `, [id]);

        const sessions = sessionsResult.rows;

        // 4. Get Questions & Correct Answers (for scoring)
        const questionsResult = await pool.query(`
            SELECT id, correct_answer, points, type FROM questions WHERE bank_id = $1
        `, [exam.bank_id]);
        const questions = questionsResult.rows;

        // 5. Merge Data & Calculate Scores
        const monitorData = students.map(student => {
            const session = sessions.find(s => s.student_id === student.id);

            let stats = {
                score: 0,
                correct_count: 0,
                wrong_count: 0,
                unanswered_count: 0,
                essay_answered: 0,
                essay_total: 0
            };

            if (session) {
                if (session.answers) {
                    const studentAnswers = session.answers;
                    questions.forEach(q => {
                        const studentAns = studentAnswers[q.id];

                        // Count Totals
                        if (q.type === 'essay') {
                            stats.essay_total++;
                        }

                        if (studentAns) {
                            // PG Logic: Check correctness
                            if (q.type !== 'essay') {
                                if (studentAns === q.correct_answer) {
                                    stats.correct_count++;
                                } else {
                                    stats.wrong_count++;
                                }
                            } else {
                                // Essay Logic: Just count as answered
                                stats.essay_answered++;
                            }
                        } else {
                            stats.unanswered_count++;
                        }
                    });
                }

                if (session.score !== null && session.score !== undefined) {
                    stats.score = Number(session.score);
                } else {
                    let calcScore = 0;
                    if (session.answers) {
                        questions.forEach(q => {
                            if (session.answers[q.id] === q.correct_answer) {
                                calcScore += parseFloat(q.points);
                            }
                        });
                    }
                    stats.score = calcScore;
                }
            }

            return {
                student_id: student.id,
                student_name: student.full_name,
                username: student.username,
                status: session ? session.status : 'not_started',
                start_time: session ? (session.start_time_epoch ? new Date(Number(session.start_time_epoch)).toISOString() : null) : null,
                end_time: session ? (session.end_time_epoch ? new Date(Number(session.end_time_epoch)).toISOString() : null) : null,
                current_question: session ? session.current_question_index + 1 : 0,
                score: stats.score,
                correct_count: stats.correct_count,
                wrong_count: stats.wrong_count,
                unanswered_count: stats.unanswered_count,
                is_locked: session ? session.is_locked : false,
                violation_count: session ? session.violation_count : 0,
                violation_log: session ? session.violation_log : [],
                essay_stats: {
                    answered: stats.essay_answered,
                    total: stats.essay_total
                }
            };
        });

        res.json({
            exam_title: exam.title,
            exam_token: exam.exam_token,
            is_published: exam.is_published,
            created_by: exam.created_by,
            class_level: classLevel,
            total_students: students.length,
            started_count: sessions.length,
            finished_count: sessions.filter(s => s.status === 'completed').length,
            students: monitorData
        });

    } catch (error) {
        console.error(error);
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
