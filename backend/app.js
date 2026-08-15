import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import connect from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import fileRoutes from './routes/file.routes.js';
import githubRoutes from './routes/github.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

connect();

const app = express();

// ── Security headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
            connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
            workerSrc: ["'self'", "blob:"],
            frameSrc: ["'self'", "https://accounts.google.com", "http://localhost:*", "blob:"],
            frameAncestors: ["'self'"],
        }
    } : false,
    crossOriginEmbedderPolicy: false, // Required for SharedArrayBuffer / WebContainers
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'https://neura-chat-omega.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, '')] : [])
];

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
}));

// ── Response compression (gzip) ──────────────────────────────────────────────
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
}));

// ── HTTP request logging ─────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Rate limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // max 20 attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 30,                   // max 30 AI requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI request limit reached. Please wait a minute before making more requests.' },
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 50,                   // max 50 uploads per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Upload rate limit exceeded. Please try again later.' },
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,       // 1 minute
    max: 300,                  // 300 requests/minute per IP
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/users/login',       authLimiter);
app.use('/users/register',    authLimiter);
app.use('/users/google-auth', authLimiter);
app.use('/ai',                aiLimiter);
app.use('/files/upload',      uploadLimiter);
app.use('/projects',          apiLimiter);

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true,
    lastModified: true,
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/users',    userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai',       aiRoutes);
app.use('/files',    fileRoutes);
app.use('/github',   githubRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), ts: Date.now() });
});

app.get('/', (req, res) => {
    res.json({ message: 'NeuraChat API is running.' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`[Unhandled Server Error] ${req.method} ${req.path}:`, err.message);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Something went wrong')
    });
});

export default app;
