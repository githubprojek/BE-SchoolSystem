import { z } from 'zod';

const tipeEnum = z.enum(['tugas', 'UTS', 'UAS', 'praktik']);

export const createSchema = z.object({
  muridId: z.string(),
  guruId: z.string(),
  mataPelajaranId: z.string(),
  nilai: z.number(),
  tipe: tipeEnum,
  semester: z.number(),
  tahunAjaran: z.string(),
});
export const updateSchema = createSchema.partial();

export const nilaiPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  tipe: tipeEnum.optional(),
  mataPelajaranId: z.string().optional(),
  tahunAjaran: z.string().optional(),
  semester: z.coerce.number().int().optional(),

  sortBy: z.enum(['nilai', 'semester', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
