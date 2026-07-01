import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePassword } from '../features/users/hooks';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getErrorMessage } from '../lib/apiError';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const changePwMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await changePwMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 font-semibold">Change password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Current password</label>
            <Input
              type="password"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">New password</label>
            <Input
              type="password"
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm new password</label>
            <Input
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          {changePwMutation.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {getErrorMessage(changePwMutation.error, 'Failed to change password')}
            </p>
          )}

          {changePwMutation.isSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-950/40">
              Password changed successfully
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Change password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
