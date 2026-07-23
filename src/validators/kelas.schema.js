import { z } from 'zod';

export const createKelasSchema = z.object({
  nama: z.string(),
  tingkat: z.number(),
  waliKelasId: z.string().optional(),
});

export const updateKelasSchema = createKelasSchema.partial();
