import { config } from '../config/index.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

const store = new Map();

export function rateLimiter(req, _res, next) {
  const key = req.ip;
  const now = Date.now();
  const windowStart = now - config.rateLimit.windowMs;

  if (!store.has(key)) {
    store.set(key, []);
  }

  const timestamps = store.get(key).filter((t) => t > windowStart);
  timestamps.push(now);
  store.set(key, timestamps);

  if (timestamps.length > config.rateLimit.max) {
    return next(new AppError(429, ErrorCodes.RATE_LIMITED, 'Too many requests'));
  }

  next();
}
