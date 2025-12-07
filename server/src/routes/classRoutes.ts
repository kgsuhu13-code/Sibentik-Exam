import express from 'express';
import { getClasses, getStudentsByClass } from '../controllers/classController.js';
import { authenticateToken, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken, requireAuth);

router.get('/', getClasses);
router.get('/students', getStudentsByClass);

export default router;
