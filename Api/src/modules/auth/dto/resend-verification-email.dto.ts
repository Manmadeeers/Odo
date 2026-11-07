import { z } from 'zod';

export const resendVerificationEmailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type ResendVerificationEmailDto = z.infer<
  typeof resendVerificationEmailSchema
>;
