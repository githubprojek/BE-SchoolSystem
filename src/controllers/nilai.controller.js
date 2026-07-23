import { ErrorCodes } from '../errors/error-codes.js';
import { AppError } from '../errors/AppError.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/http-response.js';
import { createSchema, updateSchema } from '../validators/nilai.schema.js';
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
    const nilai = await nilaiService.findAll();
    return sendSuccess(res, { nilai });
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
    const nilai = await nilaiService.updateById(req.params.id, parse.data);

    return sendSuccess(res, { nilai });
  },

  async deleteById(req, res) {
    await nilaiService.deleteById(req.params.id);
    return sendNoContent(res);
  },
};
