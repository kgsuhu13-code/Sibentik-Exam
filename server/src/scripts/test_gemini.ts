import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('API Key not found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Untuk versi library terbaru, mungkin perlu cara lain, tapi kita coba ini dulu
        // Atau kita coba request manual jika library tidak support listModels langsung di instance utama
        // Ternyata di library ini tidak ada method listModels di top level, tapi kita bisa coba generate dengan model dummy untuk memancing error yang lebih jelas atau coba satu per satu.

        // Kita coba model 'gemini-1.0-pro' yang lebih lama
        console.log('Testing gemini-1.0-pro...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Test");
        console.log('Success with gemini-1.0-pro');
    } catch (error) {
        console.error('Failed with gemini-1.0-pro:', error.message);
    }

    try {
        console.log('Testing gemini-1.5-flash-001...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Test");
        console.log('Success with gemini-1.5-flash-001');
    } catch (error) {
        console.error('Failed with gemini-1.5-flash-001:', error.message);
    }
}

listModels();
