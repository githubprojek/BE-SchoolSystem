import { getOrSet, invalidateCache } from '../cache/helper.js';
import { prisma } from '../db/client.js';

const userSelect = {
  id: true,
  nama: true,
  email: true,
  role: true,
  nis: true,
  nip: true,
  kelasId: true,
  mataPelajaranId: true,
  kelas: { select: { id: true, nama: true, tingkat: true } },
  mataPelajaran: { select: { id: true, nama: true, kode: true } },
};

export const userRepo = {
  async findAll() {
    return await getOrSet('user:all', () => prisma.user.findMany({ select: userSelect }), 600);
  },

  async findById(id) {
    return await getOrSet(
      `user:${id}`,
      () => prisma.user.findUnique({ where: { id }, select: userSelect }),
      600,
    );
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
    const result = await prisma.user.update({ where: { id }, data, select: userSelect });
    await Promise.all([invalidateCache(`user:${id}`), invalidateCache('user:all')]);
  },

  async deleteById(id) {
    await prisma.user.delete({ where: { id } });
    await Promise.all([invalidateCache(`user:${id}`), invalidateCache('user:all')]);
  },
};
