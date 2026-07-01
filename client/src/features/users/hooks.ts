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
      // Update auth cache
      qc.setQueryData(['auth', 'me'], user);
      // Invalidate all queries to refresh currency display everywhere
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
