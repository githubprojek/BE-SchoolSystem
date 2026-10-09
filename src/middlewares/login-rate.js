import { config } from '../config/index.js';
import { redis } from '../cache/redis.js';
import { logger } from '../logging/logger.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

const memoryStore = new Map();

function buildKey(ip, email) {
  return `login:${ip}:${(email ?? '').toLowerCase()}`;
}

function readMemory(key) {
  const entry = memoryStore.get(key);
  if (!entry) return 0;
  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return 0;
  }
  return entry.count;
}

function writeMemory(key, count) {
  if (count <= 0) {
    memoryStore.delete(key);
    return;
  }
  const existing = memoryStore.get(key);
  const expiresAt =
    existing && existing.expiresAt > Date.now()
      ? existing.expiresAt
      : Date.now() + config.loginRateLimit.windowMs;
  memoryStore.set(key, { count, expiresAt });
}

async function getFailures(key) {
  if (redis) {
    try {
      const value = await redis.get(key);
      return value ? Number(value) : 0;
    } catch (err) {
      logger.debug({ key, err: err.message }, 'Login rate limit Redis gagal - fallback memori');
    }
  }
  return readMemory(key);
}

async function addFailure(key) {
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.pexpire(key, config.loginRateLimit.windowMs);
      return;
    } catch (err) {
      logger.debug({ key, err: err.message }, 'Login rate limit Redis gagal - fallback memori');
    }
  }
  writeMemory(key, readMemory(key) + 1);
}

async function clearFailures(key) {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
      logger.debug({ key, err: err.message }, 'Login rate limit Redis gagal - fallback memori');
    }
  }
  writeMemory(key, 0);
}

export async function assertLoginAllowed(ip, email) {
  const count = await getFailures(buildKey(ip, email));
  if (count >= config.loginRateLimit.max) {
    throw new AppError(
      429,
      ErrorCodes.RATE_LIMITED,
      'Too many failed login attempts. Try again later',
    );
  }
}

export async function recordLoginFailure(ip, email) {
  await addFailure(buildKey(ip, email));
}

export async function clearLoginFailures(ip, email) {
  await clearFailures(buildKey(ip, email));
}
