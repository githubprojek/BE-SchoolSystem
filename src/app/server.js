import { app } from './app.js';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';
import { connectDB, disconnectDB } from '../db/client.js';
import { refreshTokenRepo } from '../repositories/refresh-token.repo.js';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function cleanupExpiredTokens() {
  try {
    const { count } = await refreshTokenRepo.deleteExpired();
    logger.info({ count }, 'Refresh token cleanup run');
  } catch (err) {
    logger.error({ err }, 'Refresh token cleanup failed');
  }
}

async function start() {
  await connectDB();
  await cleanupExpiredTokens();
  setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS).unref();

  const server = app.listen({ port: config.port, host: config.host, backlog: 1024 }, () => {
    logger.info(`Server listening on ${config.host}:${config.port}`);
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.requestTimeout = 30_000;

  async function shutdown(signal) {
    logger.info(`Received ${signal} - shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30_000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
