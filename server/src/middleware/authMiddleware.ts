import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

interface UserPayload {
    id: number;
    username: string;
    role: string;
    school_id?: number;
}

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // Jika tidak ada token, lanjut saja tapi user undefined (untuk public routes jika ada)
        // Atau bisa return 401 jika ingin strict.
        // Untuk kasus ini, kita ingin populate req.user jika ada token.
        next();
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara', (err: any, user: any) => {
        if (err) {
            // Token tidak valid
            console.error('Token invalid:', err);
            // Kita bisa return 403 atau lanjut tanpa user
            next();
            return;
        }

        req.user = user as UserPayload;

        // [MONITORING] Increment request counter if school_id exists
        if (req.user?.school_id) {
            // Fire and forget (don't await) to not block response time
            pool.query('UPDATE schools SET total_requests = total_requests + 1 WHERE id = $1', [req.user.school_id]).catch(err => {
                console.error('Failed to log school request:', err);
            });
        }

        next();
    });
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
        res.status(401).json({ message: 'Akses ditolak. Harap login terlebih dahulu.' });
        return;
    }
    next();
};
