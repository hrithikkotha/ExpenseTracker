import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { getErrorMessage } from '../../../lib/apiError';
import { useCreateCategory, useUpdateCategory } from '../hooks';
import type { Category } from '../category.types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(40),
  type: z.enum(['income', 'expense']),
  icon: z.string().max(8).optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Use a hex color like #4f46e5')
    .optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  category?: Category; // present = edit mode
}

export default function CategoryFormModal({ open, onClose, category }: Props) {
  const isEdit = !!category;
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: category?.name ?? '',
      type: category?.type ?? 'expense',
      icon: category?.icon ?? '🏷️',
      color: category?.color ?? '#6366f1',
    },
  });

  const close = () => {
    setFormError(null);
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: category._id,
          payload: { name: values.name, icon: values.icon, color: values.color },
        });
      } else {
        await create.mutateAsync(values);
      }
      close();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  const isSaving = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEdit ? 'Edit category' : 'New category'}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
            {formError}
          </p>
        )}
        <Input label="Name" error={errors.name?.message} {...register('name')} />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            disabled={isEdit}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
            {...register('type')}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {isEdit && (
            <p className="mt-1 text-xs text-gray-400">
              Type can’t be changed after creation.
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="w-24">
            <Input label="Icon" error={errors.icon?.message} {...register('icon')} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <input
              type="color"
              className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-700"
              {...register('color')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? 'Save changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
