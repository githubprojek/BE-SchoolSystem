import { prisma } from '../db/client.js';

const include = { guru: true, murid: true, jadwal: true };

export const absensiRepo = {
  async create(data) {
    return prisma.absensi.create({ data });
  },

  async findById(id) {
    return prisma.absensi.findUnique({ where: { id }, include });
  },

  async findConflict(murid, jadwal, tanggal) {
    return prisma.absensi.findFirst({
      where: { muridId: murid, jadwalId: jadwal, tanggal: new Date(tanggal) },
    });
  },

  async findAll() {
    return prisma.absensi.findMany({ include });
  },

  async updateById(id, data) {
    return prisma.absensi.update({ where: { id }, data, include });
  },

  async deleteById(id) {
    return prisma.absensi.delete({ where: { id } });
  },
};
