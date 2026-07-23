import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, ErrorCodes.UNAUTHORIZED, 'Not authenticated!'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          ErrorCodes.FORBIDDEN,
          `Permission denied, required roles: ${roles.join(', ')} `,
        ),
      );
    }
    next();
  };
}
