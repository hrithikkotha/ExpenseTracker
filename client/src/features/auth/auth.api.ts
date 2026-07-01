import { api } from '../../lib/axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from './auth.types';

export async function register(
  payload: RegisterCredentials,
): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
}

export async function login(payload: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
}

export async function refresh(): Promise<AuthResponse> {
  const { data } = await api.post('/auth/refresh');
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return data.data.user;
}
