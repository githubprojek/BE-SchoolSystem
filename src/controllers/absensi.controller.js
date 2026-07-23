import { absensiService } from '../services/absensi.service.js';
import { createSchema, updateSchema } from '../validators/absensi.schema.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/http-response.js';

export const absensiController = {
  async create(req, res) {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parse.error.flatten());
    }
    const absensi = await absensiService.create(parse.data);
    return sendCreated(res, absensi);
  },

  async findAll(req, res) {
    const absensi = await absensiService.findAll();
    return sendSuccess(res, { absensi });
  },

  async findById(req, res) {
    const absensi = await absensiService.findById(req.params.id);
    return sendSuccess(res, { absensi });
  },

  async updateById(req, res) {
    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parse.error.flatten());
    }
    const absensi = await absensiService.updateById(req.params.id, parse.data);
    return sendSuccess(res, { absensi });
  },

  async deleteById(req, res) {
    await absensiService.deleteById(req.params.id);
    return sendNoContent(res);
  },
};
