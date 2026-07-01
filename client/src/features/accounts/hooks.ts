import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from './api';
import type { CreateAccountInput, UpdateAccountInput } from './types';

const ACCOUNTS_QUERY_KEY = 'accounts';

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, includeArchived],
    queryFn: () => accountsApi.list(includeArchived),
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, id],
    queryFn: () => accountsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) =>
      accountsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
    },
  });
}

export function useAccountBalance(id: string) {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, id, 'balance'],
    queryFn: () => accountsApi.getBalance(id),
    enabled: !!id,
  });
}

export function useSyncBalances() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accountsApi.syncBalances(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
    },
  });
}
