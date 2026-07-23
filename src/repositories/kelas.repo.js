import { prisma } from '../db/client.js';

export const kelasRepo = {
  async create(data) {
    return prisma.kelas.create({ data });
  },

  async findAll() {
    return prisma.kelas.findMany({ include: { waliKelas: true } });
  },

  async findByNamaAndTingkat(nama, tingkat) {
    return prisma.kelas.findFirst({ where: { nama, tingkat } });
  },

  async findById(id) {
    return prisma.kelas.findUnique({ where: { id }, include: { waliKelas: true } });
  },

  async updateById(id, data) {
    return prisma.kelas.update({ where: { id }, data, include: { waliKelas: true } });
  },

  async deleteById(id) {
    return prisma.kelas.delete({ where: { id } });
  },
};
