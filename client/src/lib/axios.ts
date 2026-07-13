import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  clearAccessToken,
  getAccessToken,
  notifyAuthFailure,
  setAccessToken,
} from './tokenStore';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send/receive the refresh cookie
});

// Attach the in-memory access token to every request.
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Endpoints that must never trigger the refresh-retry loop.
const AUTH_BYPASS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Single-flight refresh: concurrent 401s share one refresh request.
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const { data } = await api.post('/auth/refresh');
  const token: string = data.data.accessToken;
  setAccessToken(token);
  return token;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const shouldRefresh =
      status === 401 &&
      original &&
      !original._retry &&
      !AUTH_BYPASS.some((path) => url.includes(path));

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshPromise = refreshPromise ?? performRefresh();
      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      clearAccessToken();
      notifyAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);
