import { z } from 'zod';

const PLACEHOLDER_SECRET = 'change-me-to-a-long-random-string';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
    REDIS_URL: z.string().optional(),
    CORS_ORIGINS: z.string().optional(),
  })
  .refine((e) => e.JWT_SECRET !== e.JWT_REFRESH_SECRET, {
    message: 'JWT_SECRET dan JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  })
  .refine(
    (e) => e.JWT_SECRET !== PLACEHOLDER_SECRET && e.JWT_REFRESH_SECRET !== PLACEHOLDER_SECRET,
    {
      message: 'JWT secret still uses the values from .env.example',
      path: ['JWT_SECRET'],
    },
  );

export function parseEnv(env) {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}
