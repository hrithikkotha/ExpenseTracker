import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersApi } from './api';
import type { CreateTransferInput } from './types';

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransferInput) => transfersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteTransferPair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transferPairId: string) => transfersApi.deletePair(transferPairId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
