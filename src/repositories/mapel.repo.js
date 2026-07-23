import { prisma } from '../db/client.js';

export const mapelRepo = {
  async create(data) {
    return prisma.mapel.create({ data });
  },

  async findAll() {
    return prisma.mapel.findMany();
  },

  async findById(id) {
    return prisma.mapel.findUnique({ where: { id } });
  },

  async findByKode(kode) {
    return prisma.mapel.findUnique({ where: { kode } });
  },

  async updateById(id, data) {
    return prisma.mapel.update({ where: { id }, data });
  },

  async deleteById(id) {
    return prisma.mapel.delete({ where: { id } });
  },
};
