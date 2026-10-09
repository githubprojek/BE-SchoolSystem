import { config } from '../config/index.js';
import { redis } from '../cache/redis.js';
import { logger } from '../logging/logger.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

const memoryStore = new Map();
let lastPurge = Date.now();

function purgeStale(windowMs) {
  const now = Date.now();
  if (now - lastPurge < 60_000) return;
  lastPurge = now;

  const cutoff = now - windowMs;
  for (const [key, timestamps] of memoryStore) {
    const alive = timestamps.filter((t) => t > cutoff);
    if (alive.length === 0) memoryStore.delete(key);
    else memoryStore.set(key, alive);
  }
}

async function isLimited(key, windowMs, max) {
  if (redis) {
    const bucket = Math.floor(Date.now() / windowMs);
    const redisKey = `rl:${key}:${bucket}`;
    try {
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.pexpire(redisKey, windowMs * 2);
      return count > max;
    } catch (err) {
      logger.debug({ key, err: err.message }, 'Rate limit Redis gagal - fallback ke memori');
    }
  }

  purgeStale(windowMs);

  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (memoryStore.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  memoryStore.set(key, timestamps);

  return timestamps.length > max;
}

export async function rateLimiter(req, _res, next) {
  try {
    const limited = await isLimited(
      `global:${req.ip}`,
      config.rateLimit.windowMs,
      config.rateLimit.max,
    );

    if (limited) {
      return next(new AppError(429, ErrorCodes.RATE_LIMITED, 'Too many requests'));
    }

    return next();
  } catch (err) {
    logger.debug({ err: err.message }, 'Rate limit gagal - request dilanjutkan');
    return next();
  }
}
