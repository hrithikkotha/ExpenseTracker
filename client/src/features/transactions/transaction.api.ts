import { api } from '../../lib/axios';
import type {
  CreateTransactionPayload,
  Transaction,
  UpdateTransactionPayload,
} from './transaction.types';

export async function listTransactions(): Promise<Transaction[]> {
  const { data } = await api.get('/transactions');
  return data.data;
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
