import { getOrSet, invalidateCache } from '../cache/helper.js';
import { getVersion, bumpVersion } from '../cache/version.js';
import { prisma } from '../db/client.js';

const userSelect = {
  id: true,
  nama: true,
  email: true,
  role: true,
  nis: true,
  nip: true,
  kelasId: true,
  mataPelajaranId: true,
  kelas: { select: { id: true, nama: true, tingkat: true } },
  mataPelajaran: { select: { id: true, nama: true, kode: true } },
};

export const userRepo = {
  async findAll({ page, limit, filter, sort }) {
    const version = await getVersion('user');

    const filterPart = filter
      ? `role-${filter.role ?? ''}:nama-${filter.nama ?? ''}:email-${filter.email ?? ''}`
      : 'no-filter';
    const sortPart = sort?.sortBy ? `sortBy-${sort.sortBy}-sortOrder-${sort.sortOrder}` : 'no-sort';

    const cacheKey = `user:v${version}:p${page}:l${limit}:${filterPart}:${sortPart}`;

    return await getOrSet(
      cacheKey,
      async () => {
        const where = {};
        if (filter?.role) where.role = filter.role;
        if (filter?.nama) where.nama = { contains: filter.nama, mode: 'insensitive' };
        if (filter?.email) where.email = { contains: filter.email, mode: 'insensitive' };

        const orderBy = {};
        if (sort?.sortBy) {
          orderBy[sort.sortBy] = sort.sortOrder === 'desc' ? 'desc' : 'asc';
        } else {
          orderBy.nama = 'asc';
        }

        const [items, total] = await Promise.all([
          prisma.user.findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            select: userSelect,
          }),
          prisma.user.count({ where }),
        ]);

        return { items, total };
      },
      600,
    );
  },

  async findById(id) {
    return await getOrSet(
      `user:${id}`,
      () => prisma.user.findUnique({ where: { id }, select: userSelect }),
      600,
    );
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data) {
    const result = await prisma.user.create({ data });
    await bumpVersion('user');
    return result;
  },

  async updateById(id, data) {
    const result = await prisma.user.update({ where: { id }, data, select: userSelect });
    await Promise.all([invalidateCache(`user:${id}`), bumpVersion('user')]);
    return result;
  },

  async deleteById(id) {
    await prisma.user.delete({ where: { id } });
    await Promise.all([invalidateCache(`user:${id}`), bumpVersion('user')]);
  },
};
