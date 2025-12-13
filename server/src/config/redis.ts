import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl);

redis.on('connect', () => {
    console.log('Redis connected');
});

redis.on('error', (err: any) => {
    console.error('Redis connection error:', err);
});

export default redis;
