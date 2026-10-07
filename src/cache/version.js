import { redis } from './redis.js';
import { logger } from '../logging/logger.js';

const DEFAULT_VERSION = '1';

export async function getVersion(resource) {
  if (!redis) return DEFAULT_VERSION;

  try {
    const version = await redis.get(`ver:${resource}`);
    return version ?? DEFAULT_VERSION;
  } catch (err) {
    logger.debug({ resource, err: err.message }, 'Cache version read gagal - pakai versi default');
    return DEFAULT_VERSION;
  }
}

export async function bumpVersion(resource) {
  if (!redis) return;

  try {
    await redis.incr(`ver:${resource}`);
  } catch (err) {
    logger.debug({ resource, err: err.message }, 'Cache version bump gagal');
  }
}
