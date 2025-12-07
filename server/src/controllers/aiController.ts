import type { Request, Response } from 'express';
import pool from '../config/db.js';
import { GoogleGenAI } from "@google/genai";

export const generateQuestions = async (req: Request, res: Response): Promise<void> => {
    const { bank_id, topic, count, difficulty } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        res.status(500).json({ message: 'Server configuration error: API Key not found' });
        return;
    }

    try {
        // Inisialisasi client baru
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
            Buatkan ${count} soal pilihan ganda tentang topik '${topic}' untuk tingkat kesulitan '${difficulty}'.
            
            ATURAN PENTING:
            1. Format output WAJIB JSON Array murni tanpa markdown (jangan pakai \`\`\`json).
            2. JANGAN gunakan tag HTML apapun (seperti <p>, <br>, <b>, dll) di dalam teks soal maupun opsi. Gunakan teks polos saja.
            3. Jika ada rumus Matematika/LaTeX, GUNAKAN DOUBLE BACKSLASH agar JSON valid (contoh: gunakan \\\\frac bukan \\frac, \\\\times bukan \\times).
            4. Pastikan JSON valid dan bisa diparsing langsung.

            Struktur objek JSON:
            [
              {
                "content": "Pertanyaan soal...",
                "options": [
                  { "key": "A", "text": "Pilihan A" },
                  { "key": "B", "text": "Pilihan B" },
                  { "key": "C", "text": "Pilihan C" },
                  { "key": "D", "text": "Pilihan D" },
                  { "key": "E", "text": "Pilihan E" }
                ],
                "correct_answer": "Kunci Jawaban (Hanya huruf A/B/C/D/E)",
                "points": 10
              }
            ]
        `;

        // Panggil model (gunakan gemini-1.5-flash yang stabil)
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let text = response.text;

        if (!text) {
            throw new Error('No text returned from AI');
        }

        // Bersihkan markdown dan ekstrak JSON Array
        const cleanJson = (input: string) => {
            // Hapus markdown code blocks
            let cleaned = input.replace(/```json/gi, '').replace(/```/g, '').trim();
            // Cari array JSON pertama [...]
            const match = cleaned.match(/\[[\s\S]*\]/);
            return match ? match[0] : cleaned;
        };

        text = cleanJson(text);

        console.log('Raw AI Response:', text); // Debugging

        const generatedQuestions = JSON.parse(text);

        if (!Array.isArray(generatedQuestions)) {
            throw new Error('AI response is not an array');
        }

        // Insert ke Database
        // Insert ke Database
        for (const q of generatedQuestions) {
            // Konversi format options dari Array (AI) ke Object (Aplikasi)
            // Dari: [{ key: "A", text: "..." }] -> Menjadi: { "A": "...", "B": "..." }
            const optionsObj: Record<string, string> = {};

            if (Array.isArray(q.options)) {
                q.options.forEach((opt: any) => {
                    if (opt.key && opt.text) {
                        optionsObj[opt.key] = opt.text;
                    }
                });
            } else {
                // Fallback jika AI aneh
                Object.assign(optionsObj, q.options);
            }

            const optionsStr = JSON.stringify(optionsObj);

            await pool.query(
                `INSERT INTO questions (bank_id, type, content, options, correct_answer, points)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [bank_id, 'multiple_choice', q.content, optionsStr, q.correct_answer, q.points || 10]
            );
        }

        res.json({ message: `Berhasil men-generate ${generatedQuestions.length} soal`, data: generatedQuestions });

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: 'Gagal generate soal. Cek console server untuk detail error.' });
    }
};
