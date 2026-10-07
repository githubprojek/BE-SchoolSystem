import { redis } from './redis.js';
import { logger } from '../logging/logger.js';

export async function getOrSet(key, fetchFn, ttl = 300) {
  if (!redis) return fetchFn();

  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached);
  } catch (err) {
    logger.debug({ key, err: err.message }, 'Cache read gagal - query DB langsung');
  }

  const data = await fetchFn();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (err) {
    logger.debug({ key, err: err.message }, 'Cache write gagal - diabaikan');
  }

  return data;
}

export async function invalidateCache(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.debug({ key, err: err.message }, 'Cache invalidate gagal - diabaikan');
  }
}
