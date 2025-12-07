import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadImage } from '../controllers/uploadController.js';
import { authenticateToken } from '../middleware/authMiddleware.js'; // Optional: if you want to protect uploads

const router = Router();

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure File Filter (Only Images)
const fileFilter = (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit 5MB
});

// Route
router.post('/', authenticateToken, upload.single('image'), uploadImage);

export default router;
