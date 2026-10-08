import { prisma } from '../db/client.js';
import { getOrSet, invalidateCache } from '../cache/helper.js';
import { getVersion, bumpVersion } from '../cache/version.js';

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
  async findAll({ page, limit, filter, sort }) {
    const version = await getVersion('jadwal');

    const filterPart = filter?.hari ? `hari-${filter.hari}` : 'no-filter';
    const sortPart = sort?.sortBy ? `sortBy-${sort.sortBy}-sortOrder-${sort.sortOrder}` : 'no-sort';

    const cacheKey = `jadwal:v${version}:p${page}:l${limit}:${filterPart}:${sortPart}`;

    return await getOrSet(
      cacheKey,
      async () => {
        const where = {};
        if (filter?.hari) where.hari = filter.hari;

        const orderBy = {};
        if (sort?.sortBy) {
          orderBy[sort.sortBy] = sort.sortOrder === 'desc' ? 'desc' : 'asc';
        } else {
          orderBy.jamMulai = 'asc';
        }

        const [items, total] = await Promise.all([
          prisma.jadwal.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include,
          }),
          prisma.jadwal.count({ where }),
        ]);

        return { items, total };
      },
      600,
    );
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
    await bumpVersion('jadwal');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.jadwal.update({ where: { id }, data, include });
    await Promise.all([invalidateCache(`jadwal:${id}`), bumpVersion('jadwal')]);
    return result;
  },

  async deleteById(id) {
    await prisma.jadwal.delete({ where: { id } });
    await Promise.all([invalidateCache(`jadwal:${id}`), bumpVersion('jadwal')]);
  },
};
