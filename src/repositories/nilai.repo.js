import { getOrSet, invalidateCache } from '../cache/helper.js';
import { getVersion, bumpVersion } from '../cache/version.js';
import { prisma } from '../db/client.js';

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
  murid: { omit: { password: true, createdAt: true, updatedAt: true, nip: true } },
  mataPelajaran: true,
};
export const nilaiRepo = {
  async findAll({ page, limit, filter, sort }) {
    const version = await getVersion('nilai');

    const filterPart = filter
      ? `tipe-${filter.tipe ?? ''}:mapel-${filter.mataPelajaranId ?? ''}:ta-${filter.tahunAjaran ?? ''}:sem-${filter.semester ?? ''}`
      : 'no-filter';
    const sortPart = sort?.sortBy ? `sortBy-${sort.sortBy}-sortOrder-${sort.sortOrder}` : 'no-sort';

    const cacheKey = `nilai:v${version}:p${page}:l${limit}:${filterPart}:${sortPart}`;

    return await getOrSet(
      cacheKey,
      async () => {
        const where = {};
        if (filter?.tipe) where.tipe = filter.tipe;
        if (filter?.mataPelajaranId) where.mataPelajaranId = filter.mataPelajaranId;
        if (filter?.tahunAjaran) where.tahunAjaran = filter.tahunAjaran;
        if (filter?.semester !== undefined) where.semester = filter.semester;

        const orderBy = {};
        if (sort?.sortBy) {
          orderBy[sort.sortBy] = sort.sortOrder === 'asc' ? 'asc' : 'desc';
        } else {
          orderBy.nilai = 'desc';
        }

        const [items, total] = await Promise.all([
          prisma.nilai.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include,
          }),
          prisma.nilai.count({ where }),
        ]);

        return { items, total };
      },
      600,
    );
  },

  async findById(id) {
    return await getOrSet(
      `nilai:${id}`,
      () => prisma.nilai.findUnique({ where: { id }, include }),
      600,
    );
  },

  async create(data) {
    const result = await prisma.nilai.create({ data, include });
    await bumpVersion('nilai');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.nilai.update({ where: { id }, data, include });
    await Promise.all([invalidateCache(`nilai:${id}`), bumpVersion('nilai')]);
    return result;
  },

  async deleteById(id) {
    await prisma.nilai.delete({ where: { id } });
    await Promise.all([invalidateCache(`nilai:${id}`), bumpVersion('nilai')]);
  },
};
