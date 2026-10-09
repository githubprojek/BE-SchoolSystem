import { mapelRepo } from '../repositories/mapel.repo.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { AppError } from '../errors/AppError.js';

export const mapelService = {
  async create(data) {
    const existingCode = await mapelRepo.findByKode(data.kode);
    if (existingCode) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Cannot have same code');
    }
    return await mapelRepo.create(data);
  },

  async findAll({ page = 1, limit = 10, nama, kode, sortBy, sortOrder } = {}) {
    const filter = nama !== undefined || kode !== undefined ? { nama, kode } : undefined;

    const sort = sortBy !== undefined ? { sortBy, sortOrder: sortOrder ?? 'asc' } : undefined;

    return await mapelRepo.findAll({ page, limit, filter, sort });
  },

  async findById(id) {
    const mapel = await mapelRepo.findById(id);
    if (!mapel) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    return mapel;
  },

  async updateById(id, data) {
    const mapel = await mapelRepo.findById(id);
    if (!mapel) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    if (data.kode) {
      const existing = await mapelRepo.findByKode(data.kode);
      if (existing && existing.id !== id) {
        throw new AppError(409, ErrorCodes.CONFLICT, 'Code mataPelajaran conflict');
      }
    }
    return await mapelRepo.updateById(id, data);
  },

  async deleteById(id) {
    const mapel = await mapelRepo.findById(id);
    if (!mapel) throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    return await mapelRepo.deleteById(id);
  },
};
