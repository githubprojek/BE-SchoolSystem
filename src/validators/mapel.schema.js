import { z } from 'zod';

export const createSchema = z.object({
  nama: z.string(),
  kode: z.string().min(1).max(10),
});

export const updateSchema = createSchema.partial();
