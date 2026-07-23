import { prisma } from '../db/client.js';
import { getOrSet, invalidateCache } from '../cache/helper.js';

const include = { guru: true, murid: true, jadwal: true };

export const absensiRepo = {
  async findAll() {
    return await getOrSet('absensi:all', () => prisma.absensi.findMany({ include }), 600);
  },

  async findById(id) {
    return await getOrSet(
      `absensi:${id}`,
      () => prisma.absensi.findUnique({ where: { id }, include }),
      600,
    );
  },

  async findConflict(muridId, jadwalId, tanggal) {
    return prisma.absensi.findFirst({
      where: { muridId, jadwalId, tanggal: new Date(tanggal) },
    });
  },

  async create(data) {
    const result = await prisma.absensi.create({ data });
    await invalidateCache('absensi:all');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.absensi.update({ where: { id }, data, include });
    await Promise.all([invalidateCache('absensi:all'), invalidateCache(`absensi:${id}`)]);
    return result;
  },

  async deleteById(id) {
    await prisma.absensi.delete({ where: { id } });
    await Promise.all([invalidateCache(`absensi:${id}`), invalidateCache('absensi:all')]);
  },
};
