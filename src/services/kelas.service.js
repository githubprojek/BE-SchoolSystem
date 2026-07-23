import { kelasRepo } from '../repositories/kelas.repo.js';
import { ErrorCodes } from '../errors/error-codes.js';
import { AppError } from '../errors/AppError.js';

export const kelasService = {
  async create(data) {
    const existing = await kelasRepo.findByNamaAndTingkat(data.nama, data.tingkat);
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Class and grade conflict');
    }
    const kelas = await kelasRepo.create(data);

    return kelas;
  },

  async findAll() {
    return await kelasRepo.findAll();
  },

  async getById(id) {
    const kelas = await kelasRepo.findById(id);
    if (!kelas) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Kelas not found!');
    }
    return kelas;
  },

  async updateById(id, data) {
    const kelas = await kelasRepo.findById(id);
    if (!kelas) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'ID not found');
    }
    const existing = await kelasRepo.findByNamaAndTingkat(data.nama, data.tingkat);
    if (existing && existing.id !== id) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Class or Grade conflict');
    }

    return await kelasRepo.updateById(id, data);
  },

  async deleteById(id) {
    const kelas = await kelasRepo.findById(id);
    if (!kelas) {
      throw new AppError(404, ErrorCodes.NOT_FOUND, 'Kelas not found!');
    }
    return await kelasRepo.deleteById(id);
  },
};
