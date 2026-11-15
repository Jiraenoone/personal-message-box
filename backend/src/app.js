import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import config from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import googleDriveRoutes from './routes/googleDrive.routes.js';
import boxesRoutes from './routes/boxes.routes.js';
import publicRoutes from './routes/public.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import mediaRoutes from './routes/media.routes.js';
import logger from './utils/logger.js';

const app = express();
const FRONTEND_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');

// Real client IP behind reverse proxies (rate limiting, logs)
if (config.trustProxy) app.set('trust proxy', config.trustProxy);

// Security headers. CSP matters when Express also serves the frontend:
// blob: is needed for upload previews (images/videos picked on the public page).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      // HTTPS is enforced by the hosting proxy; this directive breaks plain-HTTP local runs
      upgradeInsecureRequests: null,
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parser
app.use(cookieParser());

// HTTP request logging
const morganStream = {
  write: (message) => logger.http(message.trim()),
};
app.use(morgan('short', { stream: morganStream }));

// Rate limiting
// Media streaming is skipped: it is authenticated + ownership-checked, and video seeking
// legitimately issues many Range requests that would exhaust the general limit.
app.use('/api/', (req, res, next) => (
  req.method === 'GET' && req.path.startsWith('/messages/') ? next() : generalLimiter(req, res, next)
));

// Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/google-drive', googleDriveRoutes);
app.use('/api/boxes/:id/messages', messagesRoutes);
app.use('/api/boxes', boxesRoutes);
app.use('/api/messages', mediaRoutes);
app.use('/api/public', publicRoutes);

// Single-origin deploy: serve the React build and fall back to index.html for client routes
if (config.serveFrontend) {
  if (!fs.existsSync(path.join(FRONTEND_DIST, 'index.html'))) {
    logger.warn(`SERVE_FRONTEND=true but ${FRONTEND_DIST}/index.html is missing — run "npm run build" in frontend/`);
  }
  app.use(express.static(FRONTEND_DIST, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'), (err) => err && next(err));
  });
}

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
