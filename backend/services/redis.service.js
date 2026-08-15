import Redis from 'ioredis';

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    retryStrategy(times) {
        if (times > 3) {
            console.warn('[Redis] Max reconnect attempts reached. Operating in degraded mode without Redis cache.');
            return null; // Stop retrying to avoid log spam
        }
        return Math.min(times * 200, 2000);
    }
};

if (process.env.REDIS_HOST && (process.env.REDIS_HOST.includes('upstash.io') || process.env.REDIS_TLS === 'true')) {
    redisConfig.tls = {};
}

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
    console.warn('[Redis Warning]:', err.message);
});

export default redisClient;