import { ErrorCodes } from '../errors/error-codes.js';
import { AppError } from '../errors/AppError.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/http-response.js';
import { createSchema, updateSchema, nilaiPaginationSchema } from '../validators/nilai.schema.js';
import { nilaiService } from '../services/nilai.service.js';

export const nilaiController = {
  async create(req, res) {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parse.error.flatten());
    }
    const nilai = await nilaiService.create(parse.data);
    return sendCreated(res, nilai);
  },

  async findAll(req, res) {
    const parsed = nilaiPaginationSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Invalid pagination query',
        parsed.error.flatten(),
      );
    }

    const { page, limit } = parsed.data;
    const { items, total } = await nilaiService.findAll(parsed.data);

    return sendSuccess(res, {
      nilai: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },

  async findById(req, res) {
    const nilai = await nilaiService.findById(req.params.id);
    return sendSuccess(res, { nilai });
  },

  async updateById(req, res) {
    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parse.error.flatten());
    }
    const nilai = await nilaiService.updateById(req.params.id, parse.data, req.user);

    return sendSuccess(res, { nilai });
  },

  async deleteById(req, res) {
    await nilaiService.deleteById(req.params.id, req.user);
    return sendNoContent(res);
  },
};
