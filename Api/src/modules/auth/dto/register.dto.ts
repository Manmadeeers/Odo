import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12).max(128),
});

export type RegisterDto = z.infer<typeof registerSchema>;
