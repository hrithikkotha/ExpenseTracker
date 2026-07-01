import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const amount = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(1_000_000_000, 'Amount is too large');

export const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense']),
    amount,
    categoryId: objectId,
    note: z.string().trim().max(280).optional(),
    date: z.coerce.date({ invalid_type_error: 'Invalid date' }),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      type: z.enum(['income', 'expense']).optional(),
      amount: amount.optional(),
      categoryId: objectId.optional(),
      note: z.string().trim().max(280).optional(),
      date: z.coerce.date().optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field is required',
    }),
});

export const transactionIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateTransactionInput = z.infer<
  typeof createTransactionSchema
>['body'];
export type UpdateTransactionInput = z.infer<
  typeof updateTransactionSchema
>['body'];
