import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createBudgetSchema = z.object({
  body: z.object({
    categoryId: objectId.optional().nullable(),
    amount: z.number().positive('Amount must be greater than 0'),
    period: z.enum(['monthly', 'yearly']),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100),
  }),
});

export const updateBudgetSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    amount: z.number().positive('Amount must be greater than 0'),
  }),
});

export const budgetIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>['body'];
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>['body'];
