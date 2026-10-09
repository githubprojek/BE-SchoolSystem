import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { mapelService } from '../services/mapel.service.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/http-response.js';
import { createSchema, updateSchema, mapelPaginationSchema } from '../validators/mapel.schema.js';

export const mapelController = {
  async create(req, res) {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parse.error.flatten());
    }
    const mapel = await mapelService.create(parse.data);
    return sendCreated(res, mapel);
  },

  async findById(req, res) {
    const mapel = await mapelService.findById(req.params.id);
    return sendSuccess(res, { mapel });
  },

  async findAll(req, res) {
    const parsed = mapelPaginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Invalid pagination query',
        parsed.error.flatten(),
      );
    }

    const { page, limit } = parsed.data;
    const { items, total } = await mapelService.findAll(parsed.data);

    return sendSuccess(res, {
      mapel: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },

  async updateById(req, res) {
    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parse.error.flatten());
    }
    const mapel = await mapelService.updateById(req.params.id, parse.data);
    return sendSuccess(res, { mapel });
  },

  async deleteById(req, res) {
    await mapelService.deleteById(req.params.id);
    return sendNoContent(res);
  },
};
