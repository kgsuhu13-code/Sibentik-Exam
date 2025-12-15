
import type { Request, Response, NextFunction } from 'express';
import redis from '../config/redis.js';
import jwt from 'jsonwebtoken';

export const checkMaintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const path = req.path;

        // 1. Always allow endpoints used to CHECK status or LOGIN (so admins can login)
        if (
            path.includes('/admin/system') ||
            path.includes('/auth/login') ||
            path === '/health'
        ) {
            next();
            return;
        }

        // 2. Cek Status di Redis
        const status = await redis.get('system:status');

        if (status === 'maintenance') {
            // Cek Manual Token untuk Admin Bypass
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara') as any;
                    if (decoded.role === 'admin') {
                        next();
                        return;
                    }
                } catch (e) {
                    // Token invalid, ignore and block
                }
            }

            // Block Akses
            res.status(503).json({
                message: 'Sistem sedang dalam perbaikan (Maintenance Mode).',
                maintenance: true
            });
            return;
        }

        next();
    } catch (error) {
        console.error('Maintenance Check Error:', error);
        next();
    }
};
