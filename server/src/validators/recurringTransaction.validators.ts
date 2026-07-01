import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listRecurringTransactionsSchema = z.object({
  query: z.object({
    includeInactive: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
  }),
});

export const createRecurringTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive('Amount must be greater than 0'),
    accountId: objectId,
    categoryId: objectId,
    note: z.string().trim().max(280).optional(),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
  }),
});

export const updateRecurringTransactionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      type: z.enum(['income', 'expense']).optional(),
      amount: z.number().positive().optional(),
      accountId: objectId.optional(),
      categoryId: objectId.optional(),
      note: z.string().trim().max(280).optional(),
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field is required',
    }),
});

export const recurringTransactionIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateRecurringTransactionInput = z.infer<
  typeof createRecurringTransactionSchema
>['body'];
export type UpdateRecurringTransactionInput = z.infer<
  typeof updateRecurringTransactionSchema
>['body'];
