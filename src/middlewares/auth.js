import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

export function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Missing or invalid token'));
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, role: payload.role, kelas: payload.kelas };
    next();
  } catch {
    next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired token'));
  }
}
