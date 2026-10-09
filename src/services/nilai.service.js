import { AppError } from '../errors/AppError.js';
import { nilaiRepo } from '../repositories/nilai.repo.js';
import { ErrorCodes } from '../errors/error-codes.js';

export const nilaiService = {
  async create(data) {
    return await nilaiRepo.create(data);
  },

  async findAll({
    page = 1,
    limit = 10,
    tipe,
    mataPelajaranId,
    tahunAjaran,
    semester,
    sortBy,
    sortOrder,
  } = {}) {
    const hasFilter =
      tipe !== undefined ||
      mataPelajaranId !== undefined ||
      tahunAjaran !== undefined ||
      semester !== undefined;

    const filter = hasFilter ? { tipe, mataPelajaranId, tahunAjaran, semester } : undefined;

    const sort = sortBy !== undefined ? { sortBy, sortOrder: sortOrder ?? 'desc' } : undefined;

    return await nilaiRepo.findAll({ page, limit, filter, sort });
  },

  async findById(id) {
    const result = await nilaiRepo.findById(id);
    if (!result) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    return result;
  },

  async updateById(id, data) {
    const nilai = await nilaiRepo.findById(id);
    if (!nilai) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    return await nilaiRepo.updateById(id, data);
  },

  async deleteById(id) {
    const result = await nilaiRepo.findById(id);
    if (!result) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    return await nilaiRepo.deleteById(id);
  },
};
