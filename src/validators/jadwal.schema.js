import { z } from 'zod';

const jamSchema = z
  .string()
  .regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Format HH:mm')
  .transform((val) => {
    const [h, m] = val.split(':').map(Number);
    return h * 60 + m;
  });

const hariEnum = z.enum(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']);

export const jadwalSchema = z.object({
  guruId: z.string(),
  muridId: z.string(),
  mataPelajaranId: z.string().optional(),
  kelasId: z.string().optional(),
  hari: hariEnum,
  jamMulai: jamSchema,
  jamSelesai: jamSchema,
});

export const updateJadwalSchema = jadwalSchema.partial();

export const jadwalPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  hari: hariEnum.optional(),

  sortBy: z.enum(['jamMulai', 'jamSelesai', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
