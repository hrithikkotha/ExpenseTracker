import { api as apiClient } from '@/lib/axios';
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
  AccountBalance,
} from './types';

export const accountsApi = {
  list: async (includeArchived = false): Promise<Account[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: Account[] }>(
      '/accounts',
      { params: { includeArchived } }
    );
    return data.data;
  },

  getOne: async (id: string): Promise<Account> => {
    const { data } = await apiClient.get<{ success: boolean; data: Account }>(
      `/accounts/${id}`
    );
    return data.data;
  },

  create: async (input: CreateAccountInput): Promise<Account> => {
    const { data } = await apiClient.post<{ success: boolean; data: Account }>(
      '/accounts',
      input
    );
    return data.data;
  },

  update: async (id: string, input: UpdateAccountInput): Promise<Account> => {
    const { data } = await apiClient.patch<{ success: boolean; data: Account }>(
      `/accounts/${id}`,
      input
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/accounts/${id}`);
  },

  getBalance: async (id: string): Promise<number> => {
    const { data } = await apiClient.get<{ success: boolean; data: AccountBalance }>(
      `/accounts/${id}/balance`
    );
    return data.data.balance;
  },

  syncBalances: async (): Promise<void> => {
    await apiClient.post('/accounts/sync');
  },
};
