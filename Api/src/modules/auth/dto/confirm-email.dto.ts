import { z } from 'zod';

export const confirmEmailSchema = z.object({
  token: z.string().min(32).max(128),
});

export type ConfirmEmailDto = z.infer<typeof confirmEmailSchema>;
