import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, 'Color must be a hex value like #4f46e5');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const listCategoriesSchema = z.object({
  query: z.object({
    type: z.enum(['income', 'expense']).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(40),
    type: z.enum(['income', 'expense']),
    icon: z.string().trim().max(8).optional(),
    color: hexColor.optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      name: z.string().trim().min(1).max(40).optional(),
      icon: z.string().trim().max(8).optional(),
      color: hexColor.optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: 'At least one field is required',
    }),
});

export const categoryIdSchema = z.object({
  params: z.object({ id: objectId }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
