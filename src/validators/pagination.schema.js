import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  nama: z.string().optional(),
  tingkat: z.coerce.number().int().optional(),

  sortBy: z.enum(['nama', 'tingkat']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
