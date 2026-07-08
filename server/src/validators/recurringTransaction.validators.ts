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
    purpose: z.string().trim().min(1, 'Purpose is required').max(100),
    note: z.string().trim().max(280).optional(),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional().default([]),
    executionTime: z
      .string()
      .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'executionTime must be HH:MM')
      .optional()
      .default('09:00'),
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
      purpose: z.string().trim().min(1).max(100).optional(),
      note: z.string().trim().max(280).optional(),
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).optional(),
      daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
      executionTime: z
        .string()
        .regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'executionTime must be HH:MM')
        .optional(),
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

export const setOverrideAmountSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    amount: z.number().positive('Override amount must be greater than 0'),
  }),
});

export type CreateRecurringTransactionInput = z.infer<
  typeof createRecurringTransactionSchema
>['body'];
export type UpdateRecurringTransactionInput = z.infer<
  typeof updateRecurringTransactionSchema
>['body'];
export type SetOverrideAmountInput = z.infer<typeof setOverrideAmountSchema>['body'];
