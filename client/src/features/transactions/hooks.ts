import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as txnApi from './transaction.api';
import type {
  CreateTransactionPayload,
  Transaction,
  UpdateTransactionPayload,
} from './transaction.types';

export const transactionKeys = {
  all: ['transactions'] as const,
};

export function useTransactions() {
  return useQuery({
    queryKey: transactionKeys.all,
    queryFn: txnApi.listTransactions,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      txnApi.createTransaction(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTransactionPayload;
    }) => txnApi.updateTransaction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => txnApi.deleteTransaction(id),
    // Optimistic delete: remove the row immediately, roll back on failure.
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: transactionKeys.all });
      const previous = qc.getQueryData<Transaction[]>(transactionKeys.all);
      qc.setQueryData<Transaction[]>(transactionKeys.all, (old) =>
        (old ?? []).filter((t) => t._id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(transactionKeys.all, context.previous);
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  });
}
