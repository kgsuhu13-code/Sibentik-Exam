import type { Request, Response } from 'express';
import pool from '../config/db.js';

// 10. Ambil Soal untuk Ujian (Siswa) - Tanpa Kunci Jawaban
export const getExamQuestionsForStudent = async (req: Request, res: Response): Promise<void> => {
    const { examId } = req.params;
    const studentId = req.query.studentId;

    console.log(`[DEBUG] getExamQuestionsForStudent. ExamId: ${examId}, StudentId: ${studentId}`);

    try {
        // Ensure columns exist (Auto-migration)
        await pool.query(`
            ALTER TABLE exam_sessions 
            ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS violation_log JSONB DEFAULT '[]'
        `);

        // 1. Ambil Detail Ujian & Bank Soal
        const examResult = await pool.query(`
            SELECT e.*, qb.is_random_question, qb.is_random_answer, qb.class_level
            FROM exams e
            JOIN question_banks qb ON e.bank_id = qb.id
            WHERE e.id = $1
        `, [examId]);

        if (examResult.rows.length === 0) {
            res.status(404).json({ message: 'Ujian tidak ditemukan' });
            return;
        }

        const exam = examResult.rows[0];

        // Helper Normalisasi Kelas
        const normalizeClass = (cls: any) => {
            if (!cls) return '';
            let s = cls.toString().toLowerCase().replace(/kelas/g, '').trim();
            if (s === 'x' || s === '10') return '10';
            if (s === 'xi' || s === '11') return '11';
            if (s === 'xii' || s === '12') return '12';
            return s;
        };

        // Validasi Kelas Siswa
        if (studentId) {
            const studentResult = await pool.query('SELECT class_level FROM users WHERE id = $1', [studentId]);
            const studentClass = studentResult.rows[0]?.class_level;

            if (studentClass && normalizeClass(studentClass) !== normalizeClass(exam.class_level)) {
                res.status(403).json({ message: `Ujian ini hanya untuk kelas ${exam.class_level}, Anda kelas ${studentClass}` });
                return;
            }
        }

        // Validasi Waktu Ujian (Global Schedule)
        const now = new Date();
        const startTime = new Date(exam.start_time);
        const endTime = new Date(exam.end_time);

        if (now < startTime) {
            res.status(403).json({ message: 'Ujian belum dimulai' });
            return;
        }

        // 2. Cek / Buat Sesi Ujian (Source of Truth Waktu)
        let savedSession = null;
        let serverTimeRemaining = 0;

        if (studentId) {
            // Cek sesi yang ada DAN hitung durasi yang sudah berjalan (elapsed) langsung dari DB
            let sessionResult = await pool.query(`
                SELECT 
                    answers, 
                    current_question_index, 
                    start_time,
                    is_locked,
                    violation_count,
                    EXTRACT(EPOCH FROM (NOW() - start_time)) as elapsed_seconds
                FROM exam_sessions 
                WHERE exam_id = $1 AND student_id = $2
            `, [examId, studentId]);

            // Jika belum ada sesi (misal direct link tanpa lewat verify token), buat baru
            if (sessionResult.rows.length === 0) {
                // Tapi cek dulu apakah ujian sudah berakhir secara global
                if (now > endTime) {
                    res.status(403).json({ message: 'Ujian sudah berakhir' });
                    return;
                }

                console.log(`[DEBUG] Creating new session for student ${studentId} in getExamQuestions`);
                await pool.query(
                    `INSERT INTO exam_sessions (exam_id, student_id, status, start_time, answers, current_question_index, is_locked, violation_count, violation_log)
                     VALUES ($1, $2, 'ongoing', NOW(), '{}', 0, FALSE, 0, '[]')`,
                    [examId, studentId]
                );

                // Ambil lagi sesi yang baru dibuat
                sessionResult = await pool.query(`
                    SELECT 
                        answers, 
                        current_question_index, 
                        start_time,
                        is_locked,
                        violation_count,
                        EXTRACT(EPOCH FROM (NOW() - start_time)) as elapsed_seconds
                    FROM exam_sessions 
                    WHERE exam_id = $1 AND student_id = $2
                `, [examId, studentId]);
            }

            savedSession = sessionResult.rows[0];

            // CEK APAKAH TERKUNCI
            if (savedSession.is_locked) {
                res.status(403).json({
                    message: 'Ujian terkunci karena pelanggaran. Hubungi pengawas.',
                    isLocked: true,
                    violationCount: savedSession.violation_count
                });
                return;
            }

            // HITUNG SISA WAKTU (Server Side Authority)
            if (exam.duration && savedSession) {
                const durationSeconds = exam.duration * 60;
                const elapsedSeconds = parseFloat(savedSession.elapsed_seconds); // Postgres return string for numeric

                serverTimeRemaining = Math.max(0, Math.floor(durationSeconds - elapsedSeconds));

                console.log(`[DEBUG] Timer Calculation: Duration=${durationSeconds}s, Elapsed=${elapsedSeconds}s, Remaining=${serverTimeRemaining}s`);

                // Jika waktu habis, tolak akses (kecuali guru/admin mau lihat, tapi ini endpoint siswa)
                if (serverTimeRemaining <= 0) {
                    // Opsional: Auto submit di sini jika belum completed?
                    // Untuk sekarang kita return 0 dan biarkan frontend handle submit
                }
            }
        }

        // 3. Ambil Soal-soal
        let query = 'SELECT id, type, content, options, points FROM questions WHERE bank_id = $1';
        if (exam.is_random_question) {
            query += ' ORDER BY RANDOM()';
        } else {
            query += ' ORDER BY id ASC';
        }

        const questionsResult = await pool.query(query, [exam.bank_id]);
        let questions = questionsResult.rows;

        // 4. Sanitasi & Randomize Jawaban
        questions = questions.map(q => {
            let options = q.options;
            if (typeof options === 'string') {
                try { options = JSON.parse(options); } catch (e) { options = {}; }
            }
            let optionsArray: any[] = [];
            if (options && typeof options === 'object' && !Array.isArray(options)) {
                optionsArray = Object.keys(options).map(key => ({ id: key, text: options[key] }));
            } else if (Array.isArray(options)) {
                optionsArray = options.map((opt: any) => ({ id: opt.id || opt.key, text: opt.text }));
            }
            if (exam.is_random_answer && optionsArray.length > 0) {
                optionsArray = optionsArray.sort(() => Math.random() - 0.5);
            }
            return { ...q, options: optionsArray };
        });

        res.json({
            exam: {
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                end_time: exam.end_time
            },
            questions,
            saved_session: savedSession,
            remaining_seconds: serverTimeRemaining
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil soal ujian' });
    }
};

// 11. Submit Jawaban Siswa
export const submitExam = async (req: Request, res: Response): Promise<void> => {
    const { examId } = req.params;
    const { studentId, answers, currentQuestionIndex, finished } = req.body; // answers: { question_id: answer_value }

    try {
        // Cek apakah sesi sudah ada
        const checkSession = await pool.query(
            'SELECT * FROM exam_sessions WHERE exam_id = $1 AND student_id = $2',
            [examId, studentId]
        );

        if (checkSession.rows.length > 0) {
            // Cek Locked
            if (checkSession.rows[0].is_locked) {
                res.status(403).json({ message: 'Ujian terkunci. Tidak bisa menyimpan jawaban.' });
                return;
            }
        }

        let status = finished ? 'completed' : 'ongoing';
        let finalScore = 0;
        let scoresDetail: Record<string, number> = {};

        // Jika ujian selesai, HITUNG NILAI OTOMATIS (PG)
        if (finished) {
            // 1. Ambil Kunci Jawaban
            // Kita perlu bank_id dari exam dulu
            const examRes = await pool.query('SELECT bank_id FROM exams WHERE id = $1', [examId]);
            if (examRes.rows.length > 0) {
                const bankId = examRes.rows[0].bank_id;
                const questionsRes = await pool.query('SELECT id, type, correct_answer, points FROM questions WHERE bank_id = $1', [bankId]);
                const questions = questionsRes.rows;

                // 2. Hitung Skor
                questions.forEach(q => {
                    const studentAns = answers[q.id];
                    // Hanya hitung otomatis jika Pilihan Ganda (bukan essay)
                    // Atau jika essay punya kunci jawaban eksak (jarang, tapi kita handle)
                    if (q.type !== 'essay' && studentAns && studentAns === q.correct_answer) {
                        const points = parseFloat(q.points) || 0;
                        finalScore += points;
                        scoresDetail[q.id] = points;
                    } else {
                        scoresDetail[q.id] = 0; // Salah atau Essay (menunggu koreksi)
                    }
                });
            }
        }

        if (checkSession.rows.length > 0) {
            // Update
            // Jika finished, kita update score dan scores juga
            if (finished) {
                await pool.query(
                    `UPDATE exam_sessions 
                     SET answers = $1, 
                         status = $2, 
                         current_question_index = $3,
                         end_time = NOW(),
                         score = $4,
                         scores = $5
                     WHERE exam_id = $6 AND student_id = $7`,
                    [JSON.stringify(answers), status, currentQuestionIndex || 0, finalScore, JSON.stringify(scoresDetail), examId, studentId]
                );
            } else {
                // Jika belum selesai, cuma update jawaban & progres
                await pool.query(
                    `UPDATE exam_sessions 
                     SET answers = $1, 
                         status = $2, 
                         current_question_index = $3
                     WHERE exam_id = $4 AND student_id = $5`,
                    [JSON.stringify(answers), status, currentQuestionIndex || 0, examId, studentId]
                );
            }
        } else {
            // Insert Baru (seharusnya jarang terjadi di tahap submit, tapi untuk safety)
            await pool.query(
                `INSERT INTO exam_sessions (exam_id, student_id, answers, status, current_question_index, start_time, score, scores)
                 VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)`,
                [examId, studentId, JSON.stringify(answers), status, currentQuestionIndex || 0, finished ? finalScore : 0, finished ? JSON.stringify(scoresDetail) : '{}']
            );
        }

        res.json({ message: 'Jawaban berhasil disimpan' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menyimpan jawaban' });
    }
};

// 12. Ambil Riwayat Ujian Siswa
export const getStudentHistory = async (req: Request, res: Response): Promise<void> => {
    const { studentId } = req.params;

    try {
        // 1. Ambil sesi ujian yang sudah selesai
        const sessionsResult = await pool.query(`
            SELECT es.*, e.title as exam_title, e.bank_id, qb.subject, qb.class_level
            FROM exam_sessions es
            JOIN exams e ON es.exam_id = e.id
            JOIN question_banks qb ON e.bank_id = qb.id
            WHERE es.student_id = $1 AND es.status = 'completed'
            ORDER BY es.end_time DESC
        `, [studentId]);

        const history = [];

        for (const session of sessionsResult.rows) {
            // 2. Ambil soal & kunci jawaban untuk bank soal ini
            const questionsResult = await pool.query(`
                SELECT id, correct_answer, points FROM questions WHERE bank_id = $1
            `, [session.bank_id]);

            const questions = questionsResult.rows;
            const studentAnswers = session.answers || {};

            let score = 0;
            let correctCount = 0;
            let wrongCount = 0;

            questions.forEach(q => {
                const ans = studentAnswers[q.id];
                if (ans) {
                    if (ans === q.correct_answer) {
                        score += parseFloat(q.points);
                        correctCount++;
                    } else {
                        wrongCount++;
                    }
                }
            });

            history.push({
                exam_id: session.exam_id,
                exam_title: session.exam_title,
                subject: session.subject,
                class_level: session.class_level,
                end_time: session.end_time,
                score: score,
                correct_count: correctCount,
                wrong_count: wrongCount,
                total_questions: questions.length
            });
        }

        res.json(history);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil riwayat ujian' });
    }
};

// 13. Ambil Detail Review Ujian (Untuk Guru/Siswa)
export const getExamReview = async (req: Request, res: Response): Promise<void> => {
    const { examId, studentId } = req.params;
    console.log(`[DEBUG] getExamReview START. Params: examId=${examId}, studentId=${studentId}`);

    try {
        // Ensure scores column exists (Auto-migration fallback)
        await pool.query(`ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}'`);

        // 1. Ambil Sesi
        console.log('[DEBUG] Fetching session...');
        const sessionResult = await pool.query(`
            SELECT es.*, e.title as exam_title, e.bank_id
            FROM exam_sessions es
            JOIN exams e ON es.exam_id = e.id
            WHERE es.exam_id = $1 AND es.student_id = $2
        `, [examId, studentId]);

        console.log(`[DEBUG] Session found: ${sessionResult.rows.length}`);

        if (sessionResult.rows.length === 0) {
            res.status(404).json({ message: 'Sesi ujian tidak ditemukan' });
            return;
        }
        const session = sessionResult.rows[0];

        // 2. Ambil Soal Lengkap (termasuk kunci jawaban)
        console.log(`[DEBUG] Fetching questions for bank_id: ${session.bank_id}`);
        const questionsResult = await pool.query(`
            SELECT * FROM questions WHERE bank_id = $1 ORDER BY id ASC
        `, [session.bank_id]);

        console.log(`[DEBUG] Questions found: ${questionsResult.rows.length}`);

        const questions = questionsResult.rows.map(q => {
            let options = q.options;

            // 1. Parse JSON string if needed
            if (typeof options === 'string') {
                try { options = JSON.parse(options); } catch (e) { options = {}; }
            }

            // 2. Handle null/undefined
            if (!options) {
                return { ...q, options: [] };
            }

            let optionsArray: any[] = [];

            // 3. Convert to Array
            if (Array.isArray(options)) {
                optionsArray = options.map((opt: any) => ({
                    id: opt.id || opt.key || '',
                    text: opt.text || ''
                }));
            } else if (typeof options === 'object') {
                optionsArray = Object.keys(options).map(key => ({
                    id: key,
                    text: options[key]
                }));
            }

            return { ...q, options: optionsArray };
        });

        res.json({
            session,
            questions
        });

    } catch (error) {
        console.error('[ERROR] getExamReview CRASH:', error);
        res.status(500).json({ message: 'Gagal mengambil data review ujian', error: String(error) });
    }
};

// 14. Simpan Nilai Manual (Koreksi)
export const submitExamScore = async (req: Request, res: Response): Promise<void> => {
    const { examId, studentId } = req.params;
    const { scores } = req.body; // { question_id: score }

    try {
        // 1. Hitung Total Skor Baru
        // Pastikan nilai berupa angka
        const totalScore = Object.values(scores).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);

        // 2. Update scores JSON DAN total score
        await pool.query(
            `UPDATE exam_sessions 
             SET scores = $1, score = $2
             WHERE exam_id = $3 AND student_id = $4`,
            [JSON.stringify(scores), totalScore, examId, studentId]
        );
        res.json({ message: 'Nilai berhasil disimpan', totalScore });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menyimpan nilai' });
    }
};

// 15. Verifikasi Token Ujian & Mulai Sesi
export const verifyExamToken = async (req: Request, res: Response): Promise<void> => {
    const { examId } = req.params;
    const { token, studentId, reset } = req.body; // Tambah parameter reset

    try {
        // Ensure columns exist (Auto-migration)
        await pool.query(`
            ALTER TABLE exam_sessions 
            ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS violation_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS violation_log JSONB DEFAULT '[]'
        `);

        // 1. Ambil Token Ujian Asli
        const examResult = await pool.query('SELECT exam_token, start_time, end_time FROM exams WHERE id = $1', [examId]);
        if (examResult.rows.length === 0) {
            res.status(404).json({ message: 'Ujian tidak ditemukan' });
            return;
        }
        const exam = examResult.rows[0];

        // 2. Validasi Waktu
        const now = new Date();
        if (now < new Date(exam.start_time)) {
            res.status(403).json({ message: 'Ujian belum dimulai' });
            return;
        }
        if (now > new Date(exam.end_time)) {
            res.status(403).json({ message: 'Ujian sudah berakhir' });
            return;
        }

        // 3. Cek Token (Case Insensitive)
        if (exam.exam_token && exam.exam_token.toUpperCase() !== token.toUpperCase()) {
            res.status(401).json({ message: 'Token ujian salah!' });
            return;
        }

        // LOGIKA BARU: Jika reset diminta, hapus sesi lama dulu
        if (reset) {
            await pool.query(
                'DELETE FROM exam_sessions WHERE exam_id = $1 AND student_id = $2',
                [examId, studentId]
            );
        }

        // 4. Buat Sesi Jika Belum Ada
        const checkSession = await pool.query(
            'SELECT * FROM exam_sessions WHERE exam_id = $1 AND student_id = $2',
            [examId, studentId]
        );

        if (checkSession.rows.length === 0) {
            await pool.query(
                `INSERT INTO exam_sessions (exam_id, student_id, status, start_time, answers, current_question_index, is_locked, violation_count, violation_log)
                 VALUES ($1, $2, 'ongoing', NOW(), '{}', 0, FALSE, 0, '[]')`,
                [examId, studentId]
            );
        } else {
            // Jika sesi ada tapi terkunci, tolak
            if (checkSession.rows[0].is_locked) {
                res.status(403).json({ message: 'Ujian terkunci. Hubungi pengawas.' });
                return;
            }
        }

        res.json({ message: 'Token valid, ujian dimulai' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memverifikasi token' });
    }
};

// 16. Reset Sesi Ujian (Debug/Admin)
export const resetExamSession = async (req: Request, res: Response): Promise<void> => {
    const { examId } = req.params;
    const { studentId } = req.body;

    try {
        console.log(`[RESET] Deleting session for exam ${examId} student ${studentId}`);
        await pool.query(
            'DELETE FROM exam_sessions WHERE exam_id = $1 AND student_id = $2',
            [examId, studentId]
        );
        res.json({ message: 'Sesi berhasil direset' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mereset sesi' });
    }
};

// 17. Report Violation (Anti-Cheating)
export const reportViolation = async (req: Request, res: Response): Promise<void> => {
    const { examId } = req.params;
    const { studentId, reason, count, lock } = req.body;

    try {
        console.log(`[VIOLATION] Student ${studentId} Exam ${examId}: ${reason} (${count})`);

        // Ensure column exists
        await pool.query(`ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS violation_log JSONB DEFAULT '[]'`);

        // Create log entry
        const newLog = {
            time: new Date().toISOString(),
            reason: reason || 'Pelanggaran terdeteksi'
        };

        // Update violation count, lock status, and append log
        await pool.query(
            `UPDATE exam_sessions 
             SET violation_count = $1,
                 is_locked = COALESCE($2, is_locked),
                 violation_log = COALESCE(violation_log, '[]'::jsonb) || $3::jsonb
             WHERE exam_id = $4 AND student_id = $5`,
            [count, lock ? true : false, JSON.stringify([newLog]), examId, studentId]
        );

        res.json({ message: 'Pelanggaran dicatat' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mencatat pelanggaran' });
    }
};

// 18. Unlock Exam Session (Guru)
export const unlockExamSession = async (req: Request, res: Response): Promise<void> => {
    const { examId } = req.params;
    const { studentId } = req.body;

    try {
        console.log(`[UNLOCK] Unlocking exam ${examId} for student ${studentId}`);

        await pool.query(
            `UPDATE exam_sessions 
             SET is_locked = FALSE,
                 violation_count = 0,
                 violation_log = '[]'::jsonb
             WHERE exam_id = $1 AND student_id = $2`,
            [examId, studentId]
        );

        res.json({ message: 'Ujian berhasil dibuka kembali' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuka kunci ujian' });
    }
};
