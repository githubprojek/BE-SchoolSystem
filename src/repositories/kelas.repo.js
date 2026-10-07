import { prisma } from '../db/client.js';
import { invalidateCache, getOrSet } from '../cache/helper.js';
import { getVersion, bumpVersion } from '../cache/version.js';

export const kelasRepo = {
  _makeCacheKey(page, limit, filter, sort) {
    const filterPart = filter ? `nama-${filter.nama}-tingkat-${filter.tingkat}` : 'no-filter';

    const sortPart = sort ? `sortBy-${sort.sortBy}-sortOrder-${sort.sortOrder}` : 'no-sort';

    return `kelas:v${page}:l${limit}:${filterPart}:${sortPart}`;
  },

  async findAll({ page, limit, filter, sort }) {
    const version = await getVersion('kelas');

    const filterPart = filter ? `nama-${filter.nama}-tingkat-${filter.tingkat}` : 'no-filter';
    const sortPart = sort ? `sortBy-${sort.sortBy}-sortOrder-${sort.sortOrder}` : 'no-sort';

    const cacheKey = `kelas:v${version}:p${page}:l${limit}:${filterPart}:${sortPart}`;

    return await getOrSet(
      cacheKey,
      async () => {
        const where = {};
        if (filter?.nama) where.nama = { contains: filter.nama, mode: 'insensitive' };
        if (filter?.tingkat) where.tingkat = filter.tingkat;

        const orderBy = {};
        if (sort?.sortBy) {
          orderBy[sort.sortBy] = sort.sortOrder === 'desc' ? 'desc' : 'asc';
        } else {
          orderBy.nama = 'asc';
        }

        const [items, total] = await Promise.all([
          prisma.kelas.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
              waliKelas: { omit: { password: true } },
            },
          }),
          prisma.kelas.count({ where }),
        ]);

        return { items, total };
      },
      600,
    );
  },

  async findByNamaAndTingkat(nama, tingkat) {
    return prisma.kelas.findFirst({ where: { nama, tingkat } });
  },

  async findById(id) {
    return await getOrSet(
      `kelas:${id}`,
      () =>
        prisma.kelas.findUnique({
          where: { id },
          include: { waliKelas: { omit: { password: true } } },
        }),
      600,
    );
  },

  async create(data) {
    const result = await prisma.kelas.create({ data });
    await bumpVersion('kelas');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.kelas.update({
      where: { id },
      data,
      include: { waliKelas: { omit: { password: true } } },
    });
    await Promise.all([invalidateCache(`kelas:${id}`), bumpVersion('kelas')]);
    return result;
  },

  async deleteById(id) {
    await prisma.kelas.delete({ where: { id } });
    await Promise.all([invalidateCache(`kelas:${id}`), bumpVersion('kelas')]);
  },
};
