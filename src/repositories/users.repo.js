import { prisma } from '../db/client.js';

const include = { kelas: true, mataPelajaran: true };
export const userRepo = {
  async create(data) {
    return prisma.user.create({ data });
  },

  async findAll() {
    return prisma.user.findMany({ include });
  },

  async findById(id) {
    return prisma.user.findUnique({ where: { id }, include });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async updateById(id, data) {
    return prisma.user.update({ where: { id }, data, include });
  },

  async deleteById(id) {
    return prisma.user.delete({ where: { id } });
  },
};
