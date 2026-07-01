import { api } from '@/lib/axios';
import type { Tag, CreateTagInput, UpdateTagInput } from './types';

export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const { data } = await api.get<{ success: boolean; data: Tag[] }>('/tags');
    return data.data;
  },

  getOne: async (id: string): Promise<Tag> => {
    const { data } = await api.get<{ success: boolean; data: Tag }>(`/tags/${id}`);
    return data.data;
  },

  create: async (input: CreateTagInput): Promise<Tag> => {
    const { data } = await api.post<{ success: boolean; data: Tag }>('/tags', input);
    return data.data;
  },

  update: async (id: string, input: UpdateTagInput): Promise<Tag> => {
    const { data } = await api.patch<{ success: boolean; data: Tag }>(`/tags/${id}`, input);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },

  frequent: async (limit = 10): Promise<Tag[]> => {
    const { data } = await api.get<{ success: boolean; data: Tag[] }>('/tags/frequent', {
      params: { limit },
    });
    return data.data;
  },
};
