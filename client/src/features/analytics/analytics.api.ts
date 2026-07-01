import { api } from '../../lib/axios';
import type {
  Summary,
  SummaryFilters,
  Trends,
  TrendsFilters,
} from './analytics.types';

export async function getSummary(filters: SummaryFilters = {}): Promise<Summary> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined),
  );
  const { data } = await api.get('/analytics/summary', { params });
  return data.data;
}

export async function getTrends(filters: TrendsFilters = {}): Promise<Trends> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined),
  );
  const { data } = await api.get('/analytics/trends', { params });
  return data.data;
}
