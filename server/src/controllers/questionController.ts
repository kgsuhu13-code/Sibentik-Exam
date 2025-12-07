// src/controllers/questionController.ts
import type { Request, Response } from 'express';
import pool from '../config/db.js';

// Helper: Get User ID from Request (assuming auth middleware populates req.user)
const getUserId = (req: Request): number | null => {
    return (req as any).user?.id || null;
};

// Helper: Get User School ID from Request
const getUserSchoolId = (req: Request): number | null => {
    return (req as any).user?.school_id || null;
};

// --- BANK SOAL (HEADER) ---

// 1. Ambil Semua Bank Soal
export const getAllQuestionBanks = async (req: Request, res: Response): Promise<void> => {
    const userId = getUserId(req);
    const scope = req.query.scope as string || 'private'; // 'private' | 'public'

    try {
        let query = `
            SELECT qb.*, u.full_name as author_name, s.name as school_name,
            (SELECT COUNT(*) FROM questions WHERE bank_id = qb.id) as total_questions,
            (SELECT COUNT(*) FROM questions WHERE bank_id = qb.id AND type = 'multiple_choice') as mc_count,
            (SELECT COUNT(*) FROM questions WHERE bank_id = qb.id AND type = 'essay') as essay_count
            FROM question_banks qb
            LEFT JOIN users u ON qb.created_by = u.id
            LEFT JOIN schools s ON u.school_id = s.id
        `;

        const params: any[] = [];
        const conditions: string[] = [];

        if (scope === 'public') {
            // Show ONLY public banks
            conditions.push(`qb.is_public = true`);
        } else {
            // 'private' (default): Show ONLY my banks
            conditions.push(`qb.created_by = $${params.length + 1}`);
            params.push(userId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY qb.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data bank soal' });
    }
};

// 2. Buat Bank Soal Baru
export const createQuestionBank = async (req: Request, res: Response): Promise<void> => {
    const { title, subject, class_level, is_random_question, is_random_answer, is_public, description } = req.body;
    const created_by = getUserId(req);

    try {
        const result = await pool.query(
            `INSERT INTO question_banks (title, subject, class_level, created_by, is_random_question, is_random_answer, is_public, description) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, subject, class_level, created_by, is_random_question || false, is_random_answer || false, is_public || false, description || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal membuat bank soal' });
    }
};

// 3. Hapus Bank Soal
export const deleteQuestionBank = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    try {
        // Cek kepemilikan
        const check = await pool.query('SELECT created_by FROM question_banks WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            res.status(404).json({ message: 'Bank soal tidak ditemukan' });
            return;
        }

        // Jika user bukan pemilik (dan bukan admin/super, asumsi sementara strict owner)
        if (check.rows[0].created_by && check.rows[0].created_by !== userId) {
            res.status(403).json({ message: 'Anda tidak memiliki izin menghapus bank soal ini' });
            return;
        }

        await pool.query('DELETE FROM question_banks WHERE id = $1', [id]);
        res.json({ message: 'Bank soal berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus bank soal' });
    }
};

// --- BUTIR SOAL (DETAIL) ---

// 4. Ambil Soal berdasarkan Bank ID
export const getQuestionsByBankId = async (req: Request, res: Response): Promise<void> => {
    const { bankId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM questions WHERE bank_id = $1 ORDER BY id ASC', [bankId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil butir soal' });
    }
};

// 5. Tambah Soal Baru
export const addQuestion = async (req: Request, res: Response): Promise<void> => {
    const { bank_id, type, content, options, correct_answer, points } = req.body;
    const userId = getUserId(req);

    try {
        // Cek kepemilikan bank soal
        const check = await pool.query('SELECT created_by FROM question_banks WHERE id = $1', [bank_id]);
        if (check.rows.length === 0) return; // Should handle 404

        if (check.rows[0].created_by && check.rows[0].created_by !== userId) {
            res.status(403).json({ message: 'Anda tidak memiliki izin mengedit bank soal ini' });
            return;
        }

        const result = await pool.query(
            `INSERT INTO questions (bank_id, type, content, options, correct_answer, points)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [bank_id, type, content, JSON.stringify(options), correct_answer, points]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menambahkan soal' });
    }
};

// 6. Hapus Butir Soal
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    try {
        // Cek kepemilikan via join
        const check = await pool.query(`
            SELECT qb.created_by 
            FROM questions q
            JOIN question_banks qb ON q.bank_id = qb.id
            WHERE q.id = $1
        `, [id]);

        if (check.rows.length === 0) {
            res.status(404).json({ message: 'Soal tidak ditemukan' });
            return;
        }

        if (check.rows[0].created_by && check.rows[0].created_by !== userId) {
            res.status(403).json({ message: 'Anda tidak memiliki izin menghapus soal ini' });
            return;
        }

        await pool.query('DELETE FROM questions WHERE id = $1', [id]);
        res.json({ message: 'Soal berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus soal' });
    }
};

// 7. Ambil Detail Bank Soal
export const getQuestionBankById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT qb.*, u.full_name as author_name 
            FROM question_banks qb
            LEFT JOIN users u ON qb.created_by = u.id
            WHERE qb.id = $1
        `, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Bank soal tidak ditemukan' });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil detail bank soal' });
    }
};

// 8. Update Bank Soal (termasuk setting acak & public)
export const updateQuestionBank = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, subject, class_level, is_random_question, is_random_answer, is_public, description } = req.body;
    const userId = getUserId(req);

    try {
        // Cek kepemilikan
        const check = await pool.query('SELECT created_by FROM question_banks WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            res.status(404).json({ message: 'Bank soal tidak ditemukan' });
            return;
        }

        if (check.rows[0].created_by && check.rows[0].created_by !== userId) {
            res.status(403).json({ message: 'Anda tidak memiliki izin mengedit bank soal ini' });
            return;
        }

        const result = await pool.query(
            `UPDATE question_banks 
             SET title = COALESCE($1, title), 
                 subject = COALESCE($2, subject), 
                 class_level = COALESCE($3, class_level),
                 is_random_question = COALESCE($4, is_random_question),
                 is_random_answer = COALESCE($5, is_random_answer),
                 is_public = COALESCE($6, is_public),
                 description = COALESCE($7, description)
             WHERE id = $8 RETURNING *`,
            [title, subject, class_level, is_random_question, is_random_answer, is_public, description, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengupdate bank soal' });
    }
};

// 9. Update Butir Soal
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { type, content, options, correct_answer, points } = req.body;
    const userId = getUserId(req);

    try {
        // Cek kepemilikan via join
        const check = await pool.query(`
            SELECT qb.created_by 
            FROM questions q
            JOIN question_banks qb ON q.bank_id = qb.id
            WHERE q.id = $1
        `, [id]);

        if (check.rows.length === 0) {
            res.status(404).json({ message: 'Soal tidak ditemukan' });
            return;
        }

        if (check.rows[0].created_by && check.rows[0].created_by !== userId) {
            res.status(403).json({ message: 'Anda tidak memiliki izin mengedit soal ini' });
            return;
        }

        const result = await pool.query(
            `UPDATE questions
             SET type = $1, content = $2, options = $3, correct_answer = $4, points = $5
             WHERE id = $6 RETURNING *`,
            [type, content, JSON.stringify(options), correct_answer, points, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengupdate soal' });
    }
};

// 10. Duplikat Bank Soal
export const duplicateQuestionBank = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = getUserId(req);

    try {
        // 1. Ambil Data Bank Asli
        const bankResult = await pool.query('SELECT * FROM question_banks WHERE id = $1', [id]);
        if (bankResult.rows.length === 0) {
            res.status(404).json({ message: 'Bank soal tidak ditemukan' });
            return;
        }
        const originalBank = bankResult.rows[0];

        // 2. Buat Bank Baru (Copy)
        const newTitle = `${originalBank.title} (Copy)`;
        const newBankResult = await pool.query(
            `INSERT INTO question_banks (title, subject, class_level, created_by, is_random_question, is_random_answer) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [newTitle, originalBank.subject, originalBank.class_level, userId, originalBank.is_random_question, originalBank.is_random_answer]
        );
        const newBankId = newBankResult.rows[0].id;

        // 3. Ambil Soal Asli
        const questionsResult = await pool.query('SELECT * FROM questions WHERE bank_id = $1', [id]);
        const questions = questionsResult.rows;

        // 4. Copy Soal ke Bank Baru
        for (const q of questions) {
            await pool.query(
                `INSERT INTO questions (bank_id, type, content, options, correct_answer, points)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [newBankId, q.type, q.content, JSON.stringify(q.options), q.correct_answer, q.points]
            );
        }

        res.status(201).json({ message: 'Bank soal berhasil diduplikasi', new_id: newBankId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menduplikasi bank soal' });
    }
};
