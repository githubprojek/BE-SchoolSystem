import { kelasService } from '../services/kelas.service.js';
import { createKelasSchema, updateKelasSchema } from '../validators/kelas.schema.js';
import { sendCreated, sendSuccess, sendNoContent } from '../utils/http-response.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';

export const kelasController = {
  async create(req, res) {
    const parsed = createKelasSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'invalid input', parsed.error.flatten());
    }
    const kelas = await kelasService.create(parsed.data);
    return sendCreated(res, kelas);
  },

  async findAll(req, res) {
    const kelas = await kelasService.findAll();
    return sendSuccess(res, { kelas });
  },

  async findById(req, res) {
    const kelas = await kelasService.getById(req.params.id);
    return sendSuccess(res, { kelas });
  },

  async updateById(req, res) {
    const parsed = updateKelasSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input', parsed.error.flatten());
    }
    const kelas = await kelasService.updateById(req.params.id, parsed.data);
    return sendSuccess(res, { kelas });
  },

  async deleteById(req, res) {
    await kelasService.deleteById(req.params.id);
    return sendNoContent(res);
  },
};
