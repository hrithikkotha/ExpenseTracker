import { api } from '../../lib/axios';
import type {
  CreateTransactionPayload,
  PaginatedTransactions,
  Transaction,
  TransactionFilters,
  UpdateTransactionPayload,
} from './transaction.types';

export async function listTransactions(
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> {
  // Drop empty/undefined params so the URL stays clean.
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== undefined && v !== '' && v !== null,
    ),
  );
  const { data } = await api.get('/transactions', { params });
  return { items: data.data, meta: data.meta };
}

export async function createTransaction(
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  const { data } = await api.post('/transactions', payload);
  return data.data;
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  const { data } = await api.patch(`/transactions/${id}`, payload);
  return data.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await api.delete(`/transactions/${id}`);
}
