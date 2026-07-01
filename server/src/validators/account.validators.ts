import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(50),
    type: z.enum([
      'cash',
      'bank',
      'credit_card',
      'debit_card',
      'digital_wallet',
      'savings',
      'investment',
      'loan',
      'custom',
    ]),
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    openingBalance: z.number().optional(),
    includeInNetWorth: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const updateAccountSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    includeInNetWorth: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const accountIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>['body'];
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>['body'];
