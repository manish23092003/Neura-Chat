import Redis from 'ioredis';


const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_HOST && process.env.REDIS_HOST.includes('upstash.io') ? {} : undefined
});


redisClient.on('connect', () => {
    console.log('Redis connected');
})

export default redisClient;