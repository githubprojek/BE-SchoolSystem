import { userService } from '../services/users.service.js';
import {
  createUserSchema,
  loginSchema,
  updateUserSchema,
  refreshTokenSchema,
} from '../validators/users.schema.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/http-response.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

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

    const result = await userService.login(parsed.data);
    return sendSuccess(res, result);
  },

  async findAll(req, res) {
    const user = await userService.findAll();
    return sendSuccess(res, { user });
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
    const parsed = updateUserSchema.safeParse(req.body);
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
