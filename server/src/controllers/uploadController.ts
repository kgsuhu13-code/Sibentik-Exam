import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

// Since we are using multer middleware in the route, the file logic is simple
export const uploadImage = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }

    // Return the URL for the uploaded image
    // Assuming the server serves 'uploads' folder statically at /uploads
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;

    res.json({
        message: 'Gambar berhasil diunggah',
        url: imageUrl
    });
};
