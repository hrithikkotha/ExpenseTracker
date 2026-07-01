import { api } from '../../lib/axios';
import type {
  Budget,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from './budget.types';

export async function listBudgets(): Promise<Budget[]> {
  const { data } = await api.get('/budgets');
  return data.data;
}

export async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  const { data } = await api.post('/budgets', payload);
  return data.data;
}

export async function updateBudget(
  id: string,
  payload: UpdateBudgetPayload,
): Promise<Budget> {
  const { data } = await api.patch(`/budgets/${id}`, payload);
  return data.data;
}

export async function deleteBudget(id: string): Promise<void> {
  await api.delete(`/budgets/${id}`);
}
