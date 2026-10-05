import { prisma } from '../db/client.js';
import { getOrSet, invalidateCache } from '../cache/helper.js';

const include = {
  guru: {
    omit: {
      password: true,
      createdAt: true,
      updatedAt: true,
      nis: true,
      nip: true,
      kelasId: true,
      mataPelajaranId: true,
    },
  },
  mataPelajaran: { omit: { createdAt: true, updatedAt: true } },
  murid: { omit: { password: true, createdAt: true, updatedAt: true, nip: true } },
  kelas: true,
};

export const jadwalRepo = {
  async findAll() {
    return await getOrSet('jadwal:all', () => prisma.jadwal.findMany({ include }), 600);
  },

  async findById(id) {
    return await getOrSet(
      `jadwal:${id}`,
      () => prisma.jadwal.findUnique({ where: { id }, include }),
      600,
    );
  },

  async findByGuru(guruId) {
    return prisma.jadwal.findMany({ where: { guruId }, include });
  },

  async findByKelas(kelasId) {
    return prisma.jadwal.findMany({ where: { kelasId }, include });
  },

  async findOverlap(kelas, hari, jamMulai, jamSelesai) {
    return prisma.jadwal.findFirst({
      where: { kelasId: kelas, hari, jamMulai: { lt: jamSelesai }, jamSelesai: { gt: jamMulai } },
    });
  },

  async create(data) {
    const result = await prisma.jadwal.create({ data, include });
    await invalidateCache('jadwal:all');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.jadwal.update({ where: { id }, data, include });
    await Promise.all([invalidateCache('jadwal:all'), invalidateCache(`jadwal:${id}`)]);
    return result;
  },

  async deleteById(id) {
    await prisma.jadwal.delete({ where: { id } });
    await Promise.all([invalidateCache(`jadwal:${id}`), invalidateCache('jadwal:all')]);
  },
};
