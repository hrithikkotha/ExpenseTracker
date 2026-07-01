import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment schema — validated once at boot so the process fails fast
 * (with a readable message) if a required variable is missing or malformed.
 * New phases append their variables here.
 */
const DEV_ACCESS_SECRET = 'dev-insecure-access-secret-change-me-0123456789';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    MONGODB_URI: z
      .string()
      .min(1, 'MONGODB_URI is required')
      .default('mongodb://127.0.0.1:27017/expense_tracker'),

    // ── Auth (Phase 1) ──────────────────────────────────────────
    // JWT access tokens are signed with this secret. Refresh tokens are
    // opaque high-entropy random strings, stored only as SHA-256 hashes,
    // so they need no signing secret.
    ACCESS_TOKEN_SECRET: z.string().min(16).default(DEV_ACCESS_SECRET),
    ACCESS_TOKEN_TTL: z.string().default('15m'),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    REFRESH_COOKIE_NAME: z.string().default('et_rt'),
  })
  .superRefine((val, ctx) => {
    // In production the access secret must be explicitly set and strong.
    if (val.NODE_ENV === 'production' && val.ACCESS_TOKEN_SECRET === DEV_ACCESS_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ACCESS_TOKEN_SECRET'],
        message: 'ACCESS_TOKEN_SECRET must be set to a strong value in production',
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '❌ Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
