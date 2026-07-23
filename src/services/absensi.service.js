import { absensiRepo } from '../repositories/absensi.repo.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { AppError } from '../errors/AppError.js';

export const absensiService = {
  async create(data) {
    const existing = await absensiRepo.findConflict(data.muridId, data.jadwal, data.tanggal);
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Conflict: cannot have the same data');
    }
    return await absensiRepo.create(data);
  },

  async findAll() {
    return await absensiRepo.findAll();
  },

  async findById(id) {
    const result = await absensiRepo.findById(id);
    if (!result) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    return result;
  },

  async updateById(id, data) {
    const absensi = await absensiRepo.findById(id);
    if (!absensi) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    if (data.muridId && data.jadwalId && data.tanggal) {
      const existing = await absensiRepo.findConflict(data.muridId, data.jadwalId, data.tanggal);
      if (existing && existing.id !== id) {
        throw new AppError(409, ErrorCodes.CONFLICT, 'Conflict: cannot have absen twice');
      }
    }
    return await absensiRepo.updateById(id, data);
  },

  async deleteById(id) {
    const absensi = await absensiRepo.findById(id);
    if (!absensi) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    return await absensiRepo.deleteById(id);
  },
};
