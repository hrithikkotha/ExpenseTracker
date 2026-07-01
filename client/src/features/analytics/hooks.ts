import { useQuery } from '@tanstack/react-query';
import * as analyticsApi from './analytics.api';
import type { SummaryFilters, TrendsFilters } from './analytics.types';

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (filters: SummaryFilters) => ['analytics', 'summary', filters] as const,
  trends: (filters: TrendsFilters) => ['analytics', 'trends', filters] as const,
};

export function useSummary(filters: SummaryFilters = {}) {
  return useQuery({
    queryKey: analyticsKeys.summary(filters),
    queryFn: () => analyticsApi.getSummary(filters),
  });
}

export function useTrends(filters: TrendsFilters = {}) {
  return useQuery({
    queryKey: analyticsKeys.trends(filters),
    queryFn: () => analyticsApi.getTrends(filters),
  });
}
