import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/logger.js';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'db query');
});

prisma.$on('info', (e) => {
  logger.info(e, 'db info');
});

prisma.$on('warn', (e) => {
  logger.warn(e, 'db warn');
});

prisma.$on('error', (e) => {
  logger.error(e, 'db error');
});

export async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    logger.error(err, 'Failed to connect to database');
    throw err;
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
