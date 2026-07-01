import { api } from '@/lib/axios';
import type { CreateTransferInput } from './types';

export const transfersApi = {
  create: async (input: CreateTransferInput): Promise<any> => {
    const { data } = await api.post('/transfers', input);
    return data.data;
  },

  deletePair: async (transferPairId: string): Promise<void> => {
    await api.delete(`/transfers/${transferPairId}`);
  },
};
