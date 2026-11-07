import { z } from 'zod';

export const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    DATABASE_URL: z
      .string()
      .min(1)
      .refine(
        (value) =>
          value.startsWith('postgres://') || value.startsWith('postgresql://'),
        'DATABASE_URL must be a PostgreSQL connection URL',
      ),
    JWT_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default('odo-api'),
    JWT_AUDIENCE: z.string().min(1).default('odo-app'),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
    MAIL_HOST: z.string().min(1).default('127.0.0.1'),
    MAIL_PORT: z.coerce.number().int().min(1).max(65_535).default(1025),
    MAIL_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    MAIL_USER: z.string().min(1).optional(),
    MAIL_PASSWORD: z.string().min(1).optional(),
    MAIL_FROM: z.string().min(1).default('Odo <noreply@odo.local>'),
    EMAIL_VERIFICATION_URL: z
      .url()
      .default('http://localhost:5173/confirm-email'),
    EMAIL_VERIFICATION_TTL_HOURS: z.coerce
      .number()
      .int()
      .positive()
      .default(24),
    PASSWORD_RESET_URL: z.url().default('http://localhost:5173/reset-password'),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
    AUTH_CLEANUP_INTERVAL_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(60),
  })
  .refine(
    ({ MAIL_USER, MAIL_PASSWORD }) =>
      Boolean(MAIL_USER) === Boolean(MAIL_PASSWORD),
    {
      message: 'MAIL_USER and MAIL_PASSWORD must be provided together',
      path: ['MAIL_USER'],
    },
  );

export type Environment = z.infer<typeof environmentSchema>;
