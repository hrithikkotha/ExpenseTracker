import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as categoryApi from './category.api';
import type {
  CategoryType,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from './category.types';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (type?: CategoryType) => ['categories', { type: type ?? 'all' }] as const,
};

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: categoryKeys.list(type),
    queryFn: () => categoryApi.listCategories(type),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      categoryApi.createCategory(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => categoryApi.updateCategory(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
