import { getOrSet, invalidateCache } from '../cache/helper.js';
import { prisma } from '../db/client.js';

const include = { guru: true, murid: true, mataPelajaran: true };

export const nilaiRepo = {
  async findAll() {
    return await getOrSet('nilai:all', () => prisma.nilai.findMany({ include }), 600);
  },

  async findById(id) {
    return await getOrSet(
      `nilai:${id}`,
      () => prisma.nilai.findUnique({ where: { id }, include }),
      600,
    );
  },

  async create(data) {
    const result = await prisma.nilai.create({ data });
    await invalidateCache('nilai:all');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.nilai.update({ where: { id }, data, include });
    await Promise.all([invalidateCache(`nilai:${id}`), invalidateCache('kelas:all')]);
    return result;
  },

  async deleteById(id) {
    await prisma.nilai.delete({ where: { id } });
    await Promise.all([invalidateCache(`nilai:${id}`), invalidateCache('kelas:all')]);
  },
};
