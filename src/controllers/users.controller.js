import { userService } from '../services/users.service.js';
import {
  createUserSchema,
  loginSchema,
  updateUserSchema,
  updateMeSchema,
  refreshTokenSchema,
  usersPaginationSchema,
} from '../validators/users.schema.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/http-response.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import {
  assertLoginAllowed,
  recordLoginFailure,
  clearLoginFailures,
} from '../middlewares/login-rate.js';

export const usersController = {
  async register(req, res) {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parsed.error.flatten());
    }

    const result = await userService.register(parsed.data);
    return sendCreated(res, result);
  },

  async login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parsed.error.flatten());
    }

    const { email } = parsed.data;

    await assertLoginAllowed(req.ip, email);

    try {
      const result = await userService.login(parsed.data);
      await clearLoginFailures(req.ip, email);
      return sendSuccess(res, result);
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 400) {
        await recordLoginFailure(req.ip, email);
      }
      throw err;
    }
  },

  async findAll(req, res) {
    const parsed = usersPaginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Invalid pagination query',
        parsed.error.flatten(),
      );
    }

    const { page, limit } = parsed.data;
    const { items, total } = await userService.findAll(parsed.data);

    return sendSuccess(res, {
      user: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },

  async findById(req, res) {
    const user = await userService.getById(req.params.id);
    return sendSuccess(res, { user });
  },

  async getProfile(req, res) {
    const user = await userService.getById(req.user.id);
    return sendSuccess(res, { user });
  },

  async updateProfile(req, res) {
    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parsed.error.flatten());
    }

    const user = await userService.updateById(req.user.id, parsed.data);
    return sendSuccess(res, { user });
  },

  async updateUsers(req, res) {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parsed.error.flatten());
    }

    const user = await userService.updateById(req.params.id, parsed.data);
    return sendSuccess(res, { user });
  },

  async deleteProfile(req, res) {
    await userService.deleteById(req.params.id);
    return sendNoContent(res);
  },

  async refresh(req, res) {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parsed.error.flatten());
    }

    const result = await userService.refresh(parsed.data.refreshToken);
    return sendSuccess(res, result);
  },

  async logout(req, res) {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parsed.error.flatten());
    }

    await userService.logout(parsed.data.refreshToken);
    return sendNoContent(res);
  },
};
