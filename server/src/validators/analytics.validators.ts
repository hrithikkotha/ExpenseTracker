import { z } from 'zod';

export const summarySchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
});

export const trendsSchema = z.object({
  query: z.object({
    period: z.enum(['monthly', 'yearly']).default('monthly'),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
  }),
});

export type SummaryQuery = z.infer<typeof summarySchema>['query'];
export type TrendsQuery = z.infer<typeof trendsSchema>['query'];
