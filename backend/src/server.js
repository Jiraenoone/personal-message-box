import config from './config/index.js';
import app from './app.js';
import logger from './utils/logger.js';
import prisma from './utils/prisma.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Frontend URL: ${config.frontendUrl}`);
  logger.info(`Health check: ${config.backendUrl}/api/health`);
});

// Graceful shutdown: finish in-flight requests (uploads), then close the DB pool
function shutdown(signal) {
  logger.info(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
  // Force-exit if something hangs (e.g. a stalled upload)
  setTimeout(() => process.exit(1), 30_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
