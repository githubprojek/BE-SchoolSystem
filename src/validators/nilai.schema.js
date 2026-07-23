import { z } from 'zod';

export const createSchema = z.object({
  muridId: z.string(),
  guruId: z.string(),
  mataPelajaranId: z.string(),
  nilai: z.number(),
  tipe: z.enum(['tugas', 'UTS', 'UAS', 'praktik']),
  semester: z.number(),
  tahunAjaran: z.string(),
});
export const updateSchema = createSchema.partial();
