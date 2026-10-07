import { z } from 'zod';

export const createUserSchema = z.object({
  nama: z.string().min(1).max(30),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['admin', 'guru', 'murid']),
  nis: z.number().int().positive().optional(),
  nip: z.number().int().positive().optional(),
  kelasId: z.string().uuid().optional(),
  mataPelajaranId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateUserSchema = createUserSchema.partial();
