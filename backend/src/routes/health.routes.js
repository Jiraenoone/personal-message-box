import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
    logger.warn('Database health check failed:', { error: error.message });
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  if (health.status === 'ok') {
    return sendSuccess(res, health, 'Server is healthy');
  }
  return sendError(res, statusCode, 'SERVICE_DEGRADED', 'Some services are unavailable', health);
});

export default router;
