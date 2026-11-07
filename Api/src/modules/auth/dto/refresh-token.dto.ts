import { z } from 'zod';

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(32).max(256),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
