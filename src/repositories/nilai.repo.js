import { prisma } from '../db/client.js';

const include = { guru: true, murid: true, mataPelajaran: true };

export const nilaiRepo = {
  async create(data) {
    return prisma.nilai.create({ data });
  },
  async findAll() {
    return prisma.nilai.findMany({ include });
  },
  async findById(id) {
    return prisma.nilai.findUnique({ where: { id }, include });
  },

  async updateById(id, data) {
    return prisma.nilai.update({ where: { id }, data, include });
  },

  async deleteById(id) {
    return prisma.nilai.delete({ where: { id } });
  },
};
