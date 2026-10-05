import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';

export const redis = config.redis.url
  ? new Redis(config.redis.url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 500, 10_000),
    })
  : null;

if (redis) {
  redis.on('ready', () => logger.info('Redis connected'));
  redis.on('error', (err) =>
    logger.warn({ err: err.message }, 'Redis error - caching dilewati sementara'),
  );
}