import { jadwalService } from '../services/jadwal.service.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { jadwalSchema, updateJadwalSchema } from '../validators/jadwal.schema.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/http-response.js';

export const jadwalController = {
  async create(req, res) {
    const parse = jadwalSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Input!', parse.error.flatten());
    }
    const jadwal = await jadwalService.create(parse.data);
    return sendCreated(res, jadwal);
  },

  async findAll(req, res) {
    const jadwal = await jadwalService.findAll();
    return sendSuccess(res, { jadwal });
  },

  async findById(req, res) {
    const jadwal = await jadwalService.findById(req.params.id);
    return sendSuccess(res, { jadwal });
  },

  async getMySchedule(req, res) {
    let jadwal;
    if (req.user.role === 'guru') {
      jadwal = await jadwalService.getByGuru(req.user.id);
    }
    if (req.user.role === 'murid') {
      jadwal = await jadwalService.getByKelas(req.user.kelasId);
    }
    return sendSuccess(res, { jadwal });
  },

  async updateById(req, res) {
    const parse = updateJadwalSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid input!', parse.error.flatten());
    }
    const jadwal = await jadwalService.updateById(req.params.id, parse.data);
    return sendSuccess(res, { jadwal });
  },

  async deleteById(req, res) {
    await jadwalService.deleteById(req.params.id);
    return sendNoContent(res);
  },
};
