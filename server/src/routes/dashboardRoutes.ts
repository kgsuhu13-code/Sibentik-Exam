import express from 'express';
import { getTeacherDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/dashboard/teacher
router.get('/teacher', authenticateToken, requireAuth, getTeacherDashboardStats);

export default router;
