export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  currency: string;
  theme: 'light' | 'dark' | 'system';
  isEmailVerified: boolean;
  provider: 'local' | 'google';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}
