import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as txnApi from './transaction.api';
import type {
  CreateTransactionPayload,
  TransactionFilters,
  UpdateTransactionPayload,
} from './transaction.types';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) =>
    ['transactions', 'list', filters] as const,
};

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => txnApi.listTransactions(filters),
    // Keep showing the previous page/results while the next query loads,
    // avoiding a flash of empty state during pagination/filtering.
    placeholderData: keepPreviousData,
  });
}

function useInvalidateTransactions() {
  const qc = useQueryClient();
  // Invalidate transactions, accounts (balance changes), and analytics
  return () => {
    qc.invalidateQueries({ queryKey: transactionKeys.all });
    qc.invalidateQueries({ queryKey: ['accounts'] }); // Invalidate accounts to refresh balances
    qc.invalidateQueries({ queryKey: ['analytics'] }); // Invalidate analytics to refresh dashboard
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      txnApi.createTransaction(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTransactionPayload;
    }) => txnApi.updateTransaction(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: string) => txnApi.deleteTransaction(id),
    // With server-side pagination the page's totals change on delete, so we
    // refetch rather than surgically editing every cached filter combination.
    onSuccess: invalidate,
  });
}
