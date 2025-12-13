
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root (one level up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkRedisKeys = async () => {
    // 1. Setup Redis
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.error('❌ REDIS_URL not found in .env');
        process.exit(1);
    }

    console.log('🔄 Connecting to Redis...');
    const redis = new Redis(redisUrl);

    try {
        // 2. Scan all keys
        console.log('🔍 Scanning specifically for Exam & Question keys...');

        const keys = await redis.keys('*'); // Get ALL keys to be sure, then filter

        const questionKeys = keys.filter(k => k.startsWith('questions:') || k.startsWith('bank:'));
        const examKeys = keys.filter(k => k.startsWith('exams:'));
        const dashboardKeys = keys.filter(k => k.startsWith('dashboard:'));

        console.log('\n----------------------------------------');
        console.log(`📊 Total Redis Keys Found: ${keys.length}`);
        console.log('----------------------------------------');

        // Questions Check
        if (questionKeys.length > 0) {
            console.log(`✅ CACHE HIT: Found ${questionKeys.length} question caches.`);
            console.log('   Examples:', questionKeys.slice(0, 3));
        } else {
            console.log('⚠️ CACHE MISS: No Question caches found. (Have you opened an exam yet?)');
        }

        // Exams List Check
        if (examKeys.length > 0) {
            console.log(`✅ CACHE HIT: Found ${examKeys.length} exam list caches.`);
            console.log('   Examples:', examKeys.slice(0, 3));
        } else {
            console.log('⚠️ CACHE MISS: No Exam List caches found. (Have you opened the teacher/student dashboard?)');
        }

        // Dashboard Check
        if (dashboardKeys.length > 0) {
            console.log(`✅ CACHE HIT: Found ${dashboardKeys.length} dashboard caches.`);
            console.log('   Examples:', dashboardKeys.slice(0, 3));
        } else {
            console.log('⚠️ CACHE MISS: No Dashboard caches found.');
        }

        console.log('----------------------------------------');

    } catch (err) {
        console.error('❌ Redis Error:', err);
    } finally {
        redis.disconnect();
        console.log('👋 Done.');
    }
};

checkRedisKeys();
