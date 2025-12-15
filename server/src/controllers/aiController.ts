import type { Request, Response } from 'express';
import pool from '../config/db.js';
import redis from '../config/redis.js';
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
            
            ATURAN PENULISAN (SANGAT PENTING):
            1. Output WAJIB JSON Array murni.
            2. "content" (Pertanyaan) dan "options" (Pilihan Jawaban) akan dirender sebagai HTML.
            
            3. ATURAN FORMATTING VISUAL (TEBAL/MIRING/PANGKAT):
               - UNTUK EFEK VISUAL: GUNAKAN TAG HTML MURNI (JANGAN DI-ESCAPE).
               - Contoh Benar: "Kata <i>asing</i> harus miring" -> Browser merender: "Kata *asing* harus miring"
               - Contoh Salah: "Kata &lt;i&gt;asing&lt;/i&gt;" -> Browser merender: "Kata <i>asing</i>" (Teks tag terlihat)
               - Tag yang BOLEH dipakai: <b>, <i>, <u>, <sub>, <sup>.
            
            4. ATURAN KODE PROGRAM (HANYA JIKA MEMBAHAS SINTAKS):
               - JIKA soal menanyakan tentang kode/sintaks, BARULAH tag tersebut di-escape.
               - Contoh: "Apa fungsi tag &lt;br&gt;?" -> Browser merender: "Apa fungsi tag <br>?"

            5. JANGAN bungkus jawaban dengan tag block seperti <p>, <div>, <h1>. Tulis isinya langsung.
            6. Rumus Matematika gunakan LaTeX dengan double backslash: \\\\frac{a}{b}.

            FORMAT OUTPUT:
            [
              {
                "content": "Pertanyaan...",
                "options": [
                  { "key": "A", "text": "Jawaban A (Bisa pakai <i>italic</i>)" },
                  { "key": "B", "text": "Jawaban B (Bisa pakai <b>bold</b>)" },
                  { "key": "C", "text": "Jawaban C" },
                  { "key": "D", "text": "Jawaban D" },
                  { "key": "E", "text": "Jawaban E" }
                ],
                "correct_answer": "A",
                "points": 10
              }
            ]
        `;

        // Panggil model (gunakan gemini-1.5-flash yang stabil)
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json", // Paksa output JSON
            }
        });

        // Akses text dari response (sesuaikan dengan SDK yang dipakai)
        // Jika pakai @google/genai, biasanya structure-nya agak beda, tapi asumsi existing code jalan untuk akses text
        let text = response.text || "";

        // Fallback jika response.text kosong atau function (tergantung versi SDK)
        if (typeof text === 'function') {
            text = (response as any).text();
        }

        if (!text) {
            throw new Error('No text returned from AI');
        }

        console.log('Raw AI Response:', text); // Debugging

        // Bersihkan markdown dan ekstrak JSON Array
        const cleanJson = (input: string) => {
            // 1. Hapus markdown code blocks (```json ... ```)
            let cleaned = input.replace(/```json/gi, '').replace(/```/g, '').trim();

            // 2. Cari pattern array JSON [...]
            // Kita cari kurung sikur pembuka pertama dan penutup terakhir
            const firstBracket = cleaned.indexOf('[');
            const lastBracket = cleaned.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                return cleaned.substring(firstBracket, lastBracket + 1);
            }

            return cleaned;
        };

        text = cleanJson(text);

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

        // Invalidate Cache
        try {
            await redis.del(`questions:${bank_id}`);

            // Clear banks cache (to update counts)
            const stream = redis.scanStream({ match: 'banks:*', count: 100 });
            stream.on('data', (keys: string[]) => {
                if (keys.length) {
                    const pipeline = redis.pipeline();
                    keys.forEach((key: any) => pipeline.del(key));
                    pipeline.exec();
                }
            });
        } catch (cacheError) {
            console.error('Cache invalidation failed:', cacheError);
        }

        res.json({ message: `Berhasil men-generate ${generatedQuestions.length} soal`, data: generatedQuestions });

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: 'Gagal generate soal. Cek console server untuk detail error.' });
    }
};
