import { prisma } from '../db/client.js';
import { invalidateCache, getOrSet } from '../cache/helper.js';
import { getVersion, bumpVersion } from '../cache/version.js';

export const mapelRepo = {
  async findAll({ page, limit, filter, sort }) {
    const version = await getVersion('mapel');

    const filterPart = filter ? `nama-${filter.nama}-kode-${filter.kode}` : 'no-filter';
    const sortPart = sort?.sortBy ? `sortBy-${sort.sortBy}-sortOrder-${sort.sortOrder}` : 'no-sort';

    const cacheKey = `mapel:v${version}:p${page}:l${limit}:${filterPart}:${sortPart}`;

    return await getOrSet(
      cacheKey,
      async () => {
        const where = {};
        if (filter?.nama) where.nama = { contains: filter.nama, mode: 'insensitive' };
        if (filter?.kode) where.kode = { contains: filter.kode, mode: 'insensitive' };

        const orderBy = {};
        if (sort?.sortBy) {
          orderBy[sort.sortBy] = sort.sortOrder === 'desc' ? 'desc' : 'asc';
        } else {
          orderBy.nama = 'asc';
        }

        const [items, total] = await Promise.all([
          prisma.mapel.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.mapel.count({ where }),
        ]);

        return { items, total };
      },
      600,
    );
  },

  async findById(id) {
    return await getOrSet(`mapel:${id}`, () => prisma.mapel.findUnique({ where: { id } }), 600);
  },

  async findByKode(kode) {
    return prisma.mapel.findUnique({ where: { kode } });
  },

  async create(data) {
    const result = await prisma.mapel.create({ data });
    await bumpVersion('mapel');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.mapel.update({ where: { id }, data });
    await Promise.all([invalidateCache(`mapel:${id}`), bumpVersion('mapel')]);
    return result;
  },

  async deleteById(id) {
    await prisma.mapel.delete({ where: { id } });
    await Promise.all([invalidateCache(`mapel:${id}`), bumpVersion('mapel')]);
  },
};
