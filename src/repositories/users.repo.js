import { getOrSet, invalidateCache } from '../cache/helper.js';
import { prisma } from '../db/client.js';

const include = { kelas: true, mataPelajaran: true };
export const userRepo = {
  async findAll() {
    return await getOrSet('user:all', () => prisma.user.findMany({ include }), 600);
  },

  async findById(id) {
    return await getOrSet(`user:${id}`, prisma.user.findUnique({ where: { id }, include }), 600);
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data) {
    const result = await prisma.user.create({ data });
    await invalidateCache('user:all');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.user.update({ where: { id }, data, include });
    await Promise.all([invalidateCache(`user:${id}`), invalidateCache('user:all')]);
  },

  async deleteById(id) {
    await prisma.user.delete({ where: { id } });
    await Promise.all([invalidateCache(`user:${id}`), invalidateCache('user:all')]);
  },
};
