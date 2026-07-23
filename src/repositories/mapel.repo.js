import { prisma } from '../db/client.js';
import { invalidateCache, getOrSet } from '../cache/helper.js';

export const mapelRepo = {
  async findAll() {
    return await getOrSet('mapel:all', () => prisma.mapel.findMany(), 600);
  },

  async findById(id) {
    return await getOrSet(`mapel:${id}`, () => prisma.mapel.findUnique({ where: { id } }), 600);
  },

  async findByKode(kode) {
    return prisma.mapel.findUnique({ where: { kode } });
  },

  async create(data) {
    const result = await prisma.mapel.create({ data });
    await invalidateCache('mapel:repo');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.mapel.update({ where: { id }, data });
    await Promise.all([invalidateCache(`mapel:${id}`), invalidateCache('mapel:all')]);
    return result;
  },

  async deleteById(id) {
    await prisma.mapel.delete({ where: { id } });
    await Promise.all([invalidateCache(`mapel:${id}`), invalidateCache('mapel:all')]);
  },
};
