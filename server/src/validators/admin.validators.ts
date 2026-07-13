import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const userIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export const toggleStatusSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>['body'];

export const adminResetPasswordSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  }),
});

export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>['body'];
