import { prisma } from '../db/client.js';

const include = {
  guru: true,
  mataPelajaran: true,
  murid: true,
  kelas: true,
};

export const jadwalRepo = {
  async create(data) {
    return prisma.jadwal.create({ data });
  },

  async findOverlap(kelas, hari, jamMulai, jamSelesai) {
    return prisma.jadwal.findFirst({
      where: { kelasId: kelas, hari, jamMulai: { lt: jamSelesai }, jamSelesai: { gt: jamMulai } },
    });
  },

  async findAll() {
    return prisma.jadwal.findMany({ include });
  },
  async findById(id) {
    return prisma.jadwal.findUnique({ where: { id }, include });
  },
  async findByGuru(guruId) {
    return prisma.jadwal.findMany({ where: { guruId }, include });
  },
  async findByKelas(kelasId) {
    return prisma.jadwal.findMany({ where: { kelasId }, include });
  },

  async updateById(id, data) {
    return prisma.jadwal.update({ where: { id }, data, include });
  },

  async deleteById(id) {
    return prisma.jadwal.delete({ where: { id } });
  },
};
