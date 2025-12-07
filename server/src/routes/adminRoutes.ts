import express from 'express';
import { getAdminDashboardStats, getUsers, createUser, getSchools, createSchool, importStudents, deleteUser, deleteAllUsersBySchool } from '../controllers/adminController.js';
import { authenticateToken, requireAuth } from '../middleware/authMiddleware.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require login
router.use(authenticateToken, requireAuth);

// Middleware to ensure user is admin
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
        return;
    }
    next();
};

router.use(requireAdmin);

router.get('/stats', getAdminDashboardStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/schools', getSchools);
router.post('/schools', createSchool);
router.post('/import-students', upload.single('file'), importStudents);
router.delete('/users/:id', deleteUser);
router.delete('/schools/:schoolId/users', deleteAllUsersBySchool);

export default router;
