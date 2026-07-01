import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useUpdateProfile } from '../features/users/hooks';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { getErrorMessage } from '../lib/apiError';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  theme: z.enum(['light', 'dark', 'system']),
});

type FormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const updateMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      currency: user?.currency ?? 'USD',
      theme: user?.theme ?? 'system',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const updated = await updateMutation.mutateAsync(data);
      setUser(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold">Profile</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input {...register('name')} error={errors.name?.message} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input value={user?.email ?? ''} disabled />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Currency</label>
            <Input
              {...register('currency')}
              error={errors.currency?.message}
              maxLength={3}
              placeholder="USD"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Theme</label>
            <select
              {...register('theme')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          {updateMutation.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
              {getErrorMessage(updateMutation.error, 'Failed to update profile')}
            </p>
          )}

          {updateMutation.isSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-950/40">
              Profile updated successfully
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
