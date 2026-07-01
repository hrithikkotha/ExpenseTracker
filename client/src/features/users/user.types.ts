export interface UpdateProfilePayload {
  name: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
