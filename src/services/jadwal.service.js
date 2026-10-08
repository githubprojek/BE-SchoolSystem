import { jadwalRepo } from '../repositories/jadwal.repo.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { AppError } from '../errors/AppError.js';

export const jadwalService = {
  async create(data) {
    if (data.jamMulai >= data.jamSelesai) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'jamMulai harus lebih kecil dari jamSelesai',
      );
    }
    const overLap = await jadwalRepo.findOverlap(
      data.kelasId,
      data.hari,
      data.jamMulai,
      data.jamSelesai,
    );
    if (overLap) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Schedule Conflict');
    }

    return await jadwalRepo.create(data);
  },

  async findAll({ page = 1, limit = 10, hari, sortBy, sortOrder } = {}) {
    const filter = hari !== undefined ? { hari } : undefined;

    const sort = sortBy !== undefined ? { sortBy, sortOrder: sortOrder ?? 'asc' } : undefined;

    return await jadwalRepo.findAll({ page, limit, filter, sort });
  },

  async findById(id) {
    const jadwal = await jadwalRepo.findById(id);
    if (!jadwal) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID schedule not found!');
    }
    return jadwal;
  },

  async getByGuru(guruId) {
    return jadwalRepo.findByGuru(guruId);
  },

  async getByKelas(kelasId) {
    return jadwalRepo.findByKelas(kelasId);
  },

  async updateById(id, data) {
    const jadwal = await jadwalRepo.findById(id);
    if (!jadwal) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }

    if (
      data.jamMulai !== undefined &&
      data.jamSelesai !== undefined &&
      data.jamMulai >= data.jamSelesai
    ) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'jamMulai harus lebih kecil dari jamSelesai',
      );
    }
    const existing = await jadwalRepo.findOverlap(
      data.kelasId,
      data.hari,
      data.jamMulai,
      data.jamSelesai,
    );
    if (existing && existing.id !== id) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Schedule Conflict');
    }

    return await jadwalRepo.updateById(id, data);
  },

  async deleteById(id) {
    const jadwal = await jadwalRepo.findById(id);
    if (!jadwal) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID Schedule not found');
    }
    return await jadwalRepo.deleteById(id);
  },
};
