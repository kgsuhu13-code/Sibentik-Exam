
import { Router } from 'express';
import { getExams, createExam, deleteExam, getExamGradesSummary, publishExam } from '../controllers/examController.js';
import { getExamMonitorData, forceFinishExam } from '../controllers/monitorController.js';
import {
    getExamQuestionsForStudent,
    submitExam,
    getStudentHistory,
    getExamReview,
    submitExamScore,
    verifyExamToken,
    resetExamSession,
    reportViolation,
    unlockExamSession
} from '../controllers/studentExamController.js';
import { authenticateToken, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Apply middleware to all routes
router.use(authenticateToken);

// Exam Management Routes
router.get('/grades', requireAuth, getExamGradesSummary);
router.get('/', getExams);
router.post('/', requireAuth, createExam);
router.delete('/:id', requireAuth, deleteExam);
router.post('/:id/publish', requireAuth, publishExam);

// Monitoring Routes
router.get('/:id/monitor', requireAuth, getExamMonitorData);
router.post('/:examId/monitor/:studentId/finish', requireAuth, forceFinishExam);

// Student Routes
router.post('/:examId/verify-token', requireAuth, verifyExamToken);
router.get('/:examId/take', requireAuth, getExamQuestionsForStudent);
router.post('/:examId/submit', requireAuth, submitExam);
router.post('/:examId/reset', requireAuth, resetExamSession);
router.get('/student/:studentId/history', requireAuth, getStudentHistory);

// Anti-Cheating Routes
router.post('/:examId/violation', requireAuth, reportViolation);
router.post('/:examId/unlock-student', requireAuth, unlockExamSession);

// Review & Grading Routes
router.get('/:examId/review/:studentId', requireAuth, getExamReview);
router.post('/:examId/score/:studentId', requireAuth, submitExamScore);

export default router;
