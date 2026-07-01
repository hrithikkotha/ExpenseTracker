import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from './api';
import type { CreateTagInput, UpdateTagInput } from './types';

const TAGS_QUERY_KEY = 'tags';

export function useTags() {
  return useQuery({
    queryKey: [TAGS_QUERY_KEY],
    queryFn: () => tagsApi.list(),
  });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: [TAGS_QUERY_KEY, id],
    queryFn: () => tagsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTagInput) => tagsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) =>
      tagsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] });
    },
  });
}

export function useFrequentTags(limit = 10) {
  return useQuery({
    queryKey: [TAGS_QUERY_KEY, 'frequent', limit],
    queryFn: () => tagsApi.frequent(limit),
  });
}
