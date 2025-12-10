// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, getMe, updateProfile, changePassword } from '../controllers/authControllers.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/update-profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

export default router;