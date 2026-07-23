import { Redis } from '@upstash/redis';
import { config } from '../config/index.js';

export const redis =
  config.redis.url && config.redis.token
    ? new Redis({ url: config.redis.url, token: config.redis.token })
    : null;
