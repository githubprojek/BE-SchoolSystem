import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { mapelService } from '../services/mapel.service.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/http-response.js';
import { createSchema, updateSchema } from '../validators/mapel.schema.js';

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
    const mapel = await mapelService.findAll();
    return sendSuccess(res, { mapel });
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
