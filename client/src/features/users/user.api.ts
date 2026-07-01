import { api } from '../../lib/axios';
import type { User } from '../auth/auth.types';
import type { ChangePasswordPayload, UpdateProfilePayload } from './user.types';

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.patch('/users/me', payload);
  return data.data;
}

export async function updateCurrency(currency: string): Promise<User> {
  const { data } = await api.patch('/users/me', { currency });
  return data.data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await api.post('/users/me/password', payload);
}
