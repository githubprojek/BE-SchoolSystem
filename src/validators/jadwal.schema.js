import { z } from 'zod';

const jamSchema = z
  .string()
  .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Format HH:mm')
  .transform((val) => {
    const [h, m] = val.split(':').map(Number);
    return h * 60 + m; // "07:00" → 420
  });

export const jadwalSchema = z.object({
  guruId: z.string(),
  muridId: z.string(),
  mataPelajaranId: z.string().optional(),
  kelasId: z.string().optional(),
  hari: z.enum(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']),
  jamMulai: jamSchema,
  jamSelesai: jamSchema,
});

export const updateJadwalSchema = jadwalSchema.partial();
