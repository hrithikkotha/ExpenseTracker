import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import CategorySelect from '../../categories/components/CategorySelect';
import { getErrorMessage } from '../../../lib/apiError';
import { toDateInputValue } from '../../../lib/format';
import { useCreateTransaction, useUpdateTransaction } from '../hooks';
import type { Transaction } from '../transaction.types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .number({ error: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Select a category'),
  date: z.string().min(1, 'Pick a date'),
  note: z.string().max(280).optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction; // present = edit mode
}

export default function TransactionFormModal({
  open,
  onClose,
  transaction,
}: Props) {
  const isEdit = !!transaction;
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      type: transaction?.type ?? 'expense',
      amount: transaction?.amount ?? ('' as unknown as number),
      categoryId: transaction?.category?._id ?? '',
      date: toDateInputValue(transaction?.date),
      note: transaction?.note ?? '',
    },
  });

  const selectedType = watch('type');

  // When the type changes, the previously chosen category no longer applies.
  const [initialType] = useState(transaction?.type ?? 'expense');
  useEffect(() => {
    if (selectedType !== initialType) setValue('categoryId', '');
  }, [selectedType, initialType, setValue]);

  const close = () => {
    setFormError(null);
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const payload = {
      type: values.type,
      amount: values.amount,
      categoryId: values.categoryId,
      date: new Date(values.date).toISOString(),
      note: values.note?.trim() || undefined,
    };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: transaction._id, payload });
      } else {
        await create.mutateAsync(payload);
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
      title={isEdit ? 'Edit transaction' : 'New transaction'}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
            {formError}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            {...register('type')}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        <CategorySelect
          label="Category"
          categoryType={selectedType}
          error={errors.categoryId?.message}
          {...register('categoryId')}
        />

        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <Input
          label="Note (optional)"
          type="text"
          error={errors.note?.message}
          {...register('note')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
