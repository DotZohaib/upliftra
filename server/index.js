// server/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Upliftra Network — Express API Server
// Provides all /api/* endpoints consumed by the Vite React SPA.
// Google Sheets is the persistent data store; JWT httpOnly cookies handle auth.
// ─────────────────────────────────────────────────────────────────────────────
import express     from 'express';
import cors        from 'cors';
import cookieParser from 'cookie-parser';
import dotenv      from 'dotenv';
dotenv.config();

import { isConfigured } from './lib/googleSheets.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';

// ── Routes ───────────────────────────────────────────────────────────────────
import authRouter         from './routes/auth.js';
import usersRouter        from './routes/users.js';
import opportunitiesRouter from './routes/opportunities.js';
import applicationsRouter from './routes/applications.js';
import mentorsRouter      from './routes/mentors.js';
import communityRouter    from './routes/community.js';
import eventsRouter       from './routes/events.js';
import startupsRouter     from './routes/startups.js';
import coursesRouter      from './routes/courses.js';
import notificationsRouter from './routes/notifications.js';
import connectionsRouter  from './routes/connections.js';
import adminRouter        from './routes/admin.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Core Middleware ───────────────────────────────────────────────────────────
app.set('trust proxy', 1); // Trust first proxy for rate limiting (important for production)

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 login/register requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts from this IP, please try again after 15 minutes' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Cookie'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ── Request Logger (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[API] ${new Date().toISOString().slice(11,19)} ${req.method} ${req.path}`);
    next();
  });
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sheetsConfigured: isConfigured(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter);
app.use('/api/users',         usersRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/applications',  applicationsRouter);
app.use('/api/mentors',       mentorsRouter);
app.use('/api/community',     communityRouter);
app.use('/api/events',        eventsRouter);
app.use('/api/startups',      startupsRouter);
app.use('/api/courses',       coursesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/connections',   connectionsRouter);
app.use('/api/admin',         adminRouter);

// ── Error Handlers ────────────────────────────────────────────────────────────
app.use('/api/*', notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────┐');
  console.log(`  │  Upliftra Network API Server — Port ${PORT}              │`);
  console.log('  ├─────────────────────────────────────────────────────┤');
  console.log(`  │  Google Sheets: ${isConfigured() ? '✅ Configured' : '⚠️  NOT configured (set .env)  '} │`);
  console.log('  │  Health:  GET  /api/health                          │');
  console.log('  │  Auth:    POST /api/auth/login                      │');
  console.log('  │  Auth:    POST /api/auth/register                   │');
  console.log('  └─────────────────────────────────────────────────────┘');
  console.log('');
  if (!isConfigured()) {
    console.log('  ⚠️  SETUP REQUIRED:');
    console.log('  1. Copy .env.example to .env');
    console.log('  2. Fill in GOOGLE_SPREADSHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY');
    console.log('  3. Run: npm run setup-sheets');
    console.log('');
  }
});

export default app;
