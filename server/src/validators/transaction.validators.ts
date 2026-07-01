import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const amount = z
  .number({ invalid_type_error: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(1_000_000_000, 'Amount is too large');

// Sort fields the client is allowed to order by (prefix "-" = descending).
const SORT_FIELDS = ['date', 'amount', 'createdAt'] as const;

export const listTransactionsSchema = z.object({
  query: z.object({
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    categoryId: objectId.optional(),
    accountId: objectId.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    q: z.string().trim().max(280).optional(),
    sort: z
      .string()
      .optional()
      .default('-date')
      .refine(
        (s) => SORT_FIELDS.includes(s.replace(/^-/, '') as (typeof SORT_FIELDS)[number]),
        { message: `sort must be one of ${SORT_FIELDS.join(', ')} (optionally prefixed with -)` },
      ),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export type ListTransactionsQuery = z.infer<
  typeof listTransactionsSchema
>['query'];

export const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense']),
    amount,
    accountId: objectId,
    categoryId: objectId,
    note: z.string().trim().max(280).optional(),
    date: z.coerce.date({ invalid_type_error: 'Invalid date' }),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      type: z.enum(['income', 'expense', 'transfer']).optional(),
      amount: amount.optional(),
      accountId: objectId.optional(),
      categoryId: objectId.optional(),
      toAccountId: objectId.optional(),
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
