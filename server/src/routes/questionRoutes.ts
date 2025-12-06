// src/routes/questionRoutes.ts
import { Router } from 'express';
import {
    getAllQuestionBanks,
    createQuestionBank,
    deleteQuestionBank,
    getQuestionsByBankId,
    addQuestion,
    deleteQuestion,
    getQuestionBankById,
    updateQuestionBank,
    updateQuestion,
    duplicateQuestionBank
} from '../controllers/questionController.js';
import { generateQuestions } from '../controllers/aiController.js';
import { authenticateToken, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Apply middleware
router.use(authenticateToken);

// Routes Bank Soal
router.get('/banks', getAllQuestionBanks); // Public/Shared (but we want user info if available)
router.post('/banks', requireAuth, createQuestionBank);
router.get('/banks/:id', getQuestionBankById);
router.put('/banks/:id', requireAuth, updateQuestionBank);
router.delete('/banks/:id', requireAuth, deleteQuestionBank);
router.post('/banks/:id/duplicate', requireAuth, duplicateQuestionBank);

// Routes Butir Soal
router.get('/banks/:bankId/questions', getQuestionsByBankId);
router.post('/questions', requireAuth, addQuestion);
router.post('/generate-ai', requireAuth, generateQuestions);
router.put('/questions/:id', requireAuth, updateQuestion);
router.delete('/questions/:id', requireAuth, deleteQuestion);

export default router;
