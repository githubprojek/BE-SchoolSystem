import { prisma } from '../db/client.js';
import { invalidateCache, getOrSet } from '../cache/helper.js';

export const kelasRepo = {
  async findAll() {
    return await getOrSet(
      'kelas:all',
      () =>
        prisma.kelas.findMany({
          include: {
            waliKelas: {
              omit: { password: true },
            },
          },
        }),
      600,
    );
  },

  async findByNamaAndTingkat(nama, tingkat) {
    return prisma.kelas.findFirst({ where: { nama, tingkat } });
  },

  async findById(id) {
    return await getOrSet(
      `kelas:${id}`,
      () =>
        prisma.kelas.findUnique({
          where: { id },
          include: { waliKelas: { omit: { password: true } } },
        }),
      600,
    );
  },

  async create(data) {
    const result = await prisma.kelas.create({ data });
    await invalidateCache('kelas:all');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.kelas.update({
      where: { id },
      data,
      include: { waliKelas: { omit: { password: true } } },
    });
    await Promise.all([invalidateCache(`kelas:${id}`), invalidateCache('kelas:all')]);
    return result;
  },

  async deleteById(id) {
    await prisma.kelas.delete({ where: { id } });
    await Promise.all([invalidateCache(`kelas:${id}`), invalidateCache('kelas:all')]);
  },
};
