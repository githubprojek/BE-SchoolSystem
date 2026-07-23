import { z } from 'zod';

export const createSchema = z.object({
  guruId: z.string(),
  muridId: z.string(),
  jadwalId: z.string(),
  tanggal: z.coerce.date(),
  status: z.enum(['hadir', 'sakit', 'alpha', 'izin']),
});

export const updateSchema = createSchema.partial();
