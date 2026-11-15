import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  // Number of reverse proxies in front of the app (e.g. 1 behind Nginx/Render/Railway).
  // Needed so rate limiting sees the real client IP instead of the proxy's.
  trustProxy: parseInt(process.env.TRUST_PROXY, 10) || 0,
  // Serve the built frontend (frontend/dist) from Express — single-origin deploy
  serveFrontend: process.env.SERVE_FRONTEND === 'true',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-1234567890',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cookie: {
    name: 'token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  upload: {
    maxImageSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 10,
    maxVideoSizeMB: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 100,
    maxImagesPerMessage: parseInt(process.env.MAX_IMAGES_PER_MESSAGE, 10) || 5,
    maxVideosPerMessage: parseInt(process.env.MAX_VIDEOS_PER_MESSAGE, 10) || 1,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10, // 10 attempts per 15 min for dev comfort
    publicSubmitMax: parseInt(process.env.PUBLIC_SUBMIT_RATE_LIMIT_MAX, 10) || 10,
  },
};

// Refuse to start in production with placeholder secrets
if (config.nodeEnv === 'production') {
  const weak = (v) => !v || v.startsWith('change-me') || v.startsWith('dev-secret');
  if (weak(process.env.JWT_SECRET) || weak(process.env.ENCRYPTION_KEY)) {
    throw new Error('JWT_SECRET and ENCRYPTION_KEY must be set to strong random values in production');
  }
}

export default config;
