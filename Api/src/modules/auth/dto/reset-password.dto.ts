import { z } from 'zod';

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  newPassword: z.string().min(12).max(128),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
