import { z } from 'zod';

export const createSchema = z.object({
  nama: z.string(),
  kode: z.string().min(1).max(10),
});

export const updateSchema = createSchema.partial();

export const mapelPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  nama: z.string().optional(),
  kode: z.string().optional(),

  sortBy: z.enum(['nama', 'kode', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
