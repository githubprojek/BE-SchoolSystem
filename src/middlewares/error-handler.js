import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { logger } from '../logging/logger.js';
import { config } from '../config/index.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  logger.error({ err }, 'Unhandled error');

  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: config.isProd ? 'An unexpected error occurred' : err.message,
      details: null,
    },
  });
}
