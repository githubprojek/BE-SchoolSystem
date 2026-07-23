import { app } from './app.js';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';
import { connectDB, disconnectDB } from '../db/client.js';

async function start() {
  await connectDB();

  const server = app.listen(config.port, config.host, () => {
    logger.info(`Server listening on ${config.host}:${config.port}`);
  });

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
