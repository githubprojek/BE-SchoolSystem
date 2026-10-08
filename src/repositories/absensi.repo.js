import { prisma } from '../db/client.js';
import { getOrSet, invalidateCache } from '../cache/helper.js';
import { getVersion, bumpVersion } from '../cache/version.js';

const include = {
  guru: { omit: { password: true } },
  murid: { omit: { password: true } },
  jadwal: true,
};

export const absensiRepo = {
  async findAll({ page, limit, filter, sort }) {
    const version = await getVersion('absensi');

    const filterPart = filter?.status ? `status-${filter.status}` : 'no-filter';
    const sortPart = sort?.sortBy ? `sortBy-${sort.sortBy}-sortOrder-${sort.sortOrder}` : 'no-sort';

    const cacheKey = `absensi:v${version}:p${page}:l${limit}:${filterPart}:${sortPart}`;

    return await getOrSet(
      cacheKey,
      async () => {
        const where = {};
        if (filter?.status) where.status = filter.status;

        const orderBy = {};
        if (sort?.sortBy) {
          orderBy[sort.sortBy] = sort.sortOrder === 'asc' ? 'asc' : 'desc';
        } else {
          orderBy.tanggal = 'desc';
        }

        const [items, total] = await Promise.all([
          prisma.absensi.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include,
          }),
          prisma.absensi.count({ where }),
        ]);

        return { items, total };
      },
      600,
    );
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
    await bumpVersion('absensi');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.absensi.update({ where: { id }, data, include });
    await Promise.all([invalidateCache(`absensi:${id}`), bumpVersion('absensi')]);
    return result;
  },

  async deleteById(id) {
    await prisma.absensi.delete({ where: { id } });
    await Promise.all([invalidateCache(`absensi:${id}`), bumpVersion('absensi')]);
  },
};
