import { z } from 'zod';

const statusEnum = z.enum(['hadir', 'sakit', 'alpha', 'izin']);

export const createSchema = z.object({
  guruId: z.string(),
  muridId: z.string(),
  jadwalId: z.string(),
  tanggal: z.coerce.date(),
  status: statusEnum,
});

export const updateSchema = createSchema.partial();

export const absensiPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: statusEnum.optional(),

  sortBy: z.enum(['tanggal', 'status', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
