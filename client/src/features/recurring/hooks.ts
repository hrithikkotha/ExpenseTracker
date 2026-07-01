import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringApi } from './api';
import type { CreateRecurringTransactionInput, UpdateRecurringTransactionInput } from './types';

const RECURRING_QUERY_KEY = 'recurring-transactions';

export function useRecurringTransactions(includeInactive = false) {
  return useQuery({
    queryKey: [RECURRING_QUERY_KEY, includeInactive],
    queryFn: () => recurringApi.list(includeInactive),
  });
}

export function useRecurringTransaction(id: string) {
  return useQuery({
    queryKey: [RECURRING_QUERY_KEY, id],
    queryFn: () => recurringApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRecurringTransactionInput) => recurringApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY] });
    },
  });
}

export function useUpdateRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRecurringTransactionInput }) =>
      recurringApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY] });
    },
  });
}

export function useDeleteRecurringTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY] });
    },
  });
}

export function useSkipNextOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringApi.skipNext(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURRING_QUERY_KEY] });
    },
  });
}
