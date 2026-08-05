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
// Disable contentSecurityPolicy in dev to allow Vite HMR; enable in production.
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false, // Required for SharedArrayBuffer / WebContainer
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
}));

// ── Response compression (gzip) ──────────────────────────────────────────────
// Compress all responses above the threshold (~1 KB).
app.use(compression({
    level: 6,              // zlib compression level (1=fastest, 9=best)
    threshold: 1024,       // only compress responses > 1 KB
    filter: (req, res) => {
        // Don't compress responses with no-transform header
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    },
}));

// ── HTTP request logging ─────────────────────────────────────────────────────
// Use 'combined' in production for full logs; 'dev' for coloured dev output.
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Rate limiting ────────────────────────────────────────────────────────────
// Strict limit for auth routes to prevent brute-force attacks.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // max 20 login/register attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

// General API limit — generous, just prevents abuse.
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 300,             // 300 requests/minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/files'), // file uploads are exempt
});

app.use('/users/login',    authLimiter);
app.use('/users/register', authLimiter);
app.use('/api',            apiLimiter);

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',       // cache static uploads for 7 days
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

export default app;
