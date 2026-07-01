import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as budgetApi from './budget.api';
import type { CreateBudgetPayload, UpdateBudgetPayload } from './budget.types';

export const budgetKeys = {
  all: ['budgets'] as const,
};

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.all,
    queryFn: budgetApi.listBudgets,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBudgetPayload) => budgetApi.createBudget(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBudgetPayload }) =>
      budgetApi.updateBudget(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetApi.deleteBudget(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}
