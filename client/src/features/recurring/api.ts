import { api } from '@/lib/axios';
import type {
  RecurringTransaction,
  CreateRecurringTransactionInput,
  UpdateRecurringTransactionInput,
} from './types';

export const recurringApi = {
  list: async (includeInactive = false): Promise<RecurringTransaction[]> => {
    const { data } = await api.get<{ success: boolean; data: RecurringTransaction[] }>(
      '/recurring-transactions',
      { params: { includeInactive } }
    );
    return data.data;
  },

  getOne: async (id: string): Promise<RecurringTransaction> => {
    const { data } = await api.get<{ success: boolean; data: RecurringTransaction }>(
      `/recurring-transactions/${id}`
    );
    return data.data;
  },

  create: async (input: CreateRecurringTransactionInput): Promise<RecurringTransaction> => {
    const { data } = await api.post<{ success: boolean; data: RecurringTransaction }>(
      '/recurring-transactions',
      input
    );
    return data.data;
  },

  update: async (id: string, input: UpdateRecurringTransactionInput): Promise<RecurringTransaction> => {
    const { data } = await api.patch<{ success: boolean; data: RecurringTransaction }>(
      `/recurring-transactions/${id}`,
      input
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/recurring-transactions/${id}`);
  },

  skipNext: async (id: string): Promise<RecurringTransaction> => {
    const { data } = await api.post<{ success: boolean; data: RecurringTransaction }>(
      `/recurring-transactions/${id}/skip`
    );
    return data.data;
  },

  setOverrideAmount: async (id: string, amount: number): Promise<RecurringTransaction> => {
    const { data } = await api.patch<{ success: boolean; data: RecurringTransaction }>(
      `/recurring-transactions/${id}/override-amount`,
      { amount }
    );
    return data.data;
  },

  processPending: async (): Promise<{ processed: number }> => {
    const { data } = await api.post<{ success: boolean; data: { processed: number } }>(
      '/recurring-transactions/process-pending'
    );
    return data.data;
  },
};

