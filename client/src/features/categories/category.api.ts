import { api } from '../../lib/axios';
import type {
  Category,
  CategoryType,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from './category.types';

export async function listCategories(
  type?: CategoryType,
): Promise<Category[]> {
  const { data } = await api.get('/categories', {
    params: type ? { type } : undefined,
  });
  return data.data;
}

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<Category> {
  const { data } = await api.post('/categories', payload);
  return data.data;
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<Category> {
  const { data } = await api.patch(`/categories/${id}`, payload);
  return data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`);
}
