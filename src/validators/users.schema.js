import { z } from 'zod';

const roleEnum = z.enum(['admin', 'guru', 'murid']);

export const createUserSchema = z.object({
  nama: z.string().min(1).max(30),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: roleEnum,
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

export const updateMeSchema = updateUserSchema.omit({
  role: true,
  nis: true,
  nip: true,
  kelasId: true,
  mataPelajaranId: true,
});

export const usersPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),

  role: roleEnum.optional(),
  nama: z.string().optional(),
  email: z.string().optional(),

  sortBy: z.enum(['nama', 'role', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
