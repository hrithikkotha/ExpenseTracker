import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as userApi from './user.api';
import type { ChangePasswordPayload, UpdateProfilePayload } from './user.types';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userApi.updateProfile(payload),
    onSuccess: (user) => {
      qc.setQueryData(['auth', 'me'], user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userApi.changePassword(payload),
  });
}

export function useUpdateCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currency: string) => userApi.updateCurrency(currency),
    onSuccess: (user) => {
      qc.setQueryData(['auth', 'me'], user);
    },
  });
}
