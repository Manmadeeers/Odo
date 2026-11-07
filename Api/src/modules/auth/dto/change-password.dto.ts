import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(12).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .refine(
    ({ currentPassword, newPassword }) => currentPassword !== newPassword,
    {
      message: 'New password must be different from the current password',
      path: ['newPassword'],
    },
  );

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
