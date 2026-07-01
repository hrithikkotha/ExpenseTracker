import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useCategories } from '../../categories/hooks';
import { useCreateBudget, useUpdateBudget } from '../hooks';
import { getErrorMessage } from '../../../lib/apiError';
import type { Budget, BudgetPeriod } from '../budget.types';

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required').nullable(),
  amount: z.number({ error: 'Amount is required' }).positive('Amount must be greater than 0'),
  period: z.enum(['monthly', 'yearly']),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100),
});

type FormData = z.infer<typeof budgetSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  budget?: Budget;
}

export default function BudgetFormModal({ open, onClose, budget }: Props) {
  const isEdit = !!budget;
  const currentYear = new Date().getFullYear();

  const { data: categories = [] } = useCategories();
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: null,
      amount: 0,
      period: 'monthly' as BudgetPeriod,
      month: new Date().getMonth() + 1,
      year: currentYear,
    },
  });

  const period = watch('period');

  useEffect(() => {
    if (open && budget) {
      reset({
        categoryId: budget.category?._id ?? null,
        amount: budget.amount,
        period: budget.period,
        month: budget.month,
        year: budget.year,
      });
    } else if (open && !budget) {
      reset({
        categoryId: null,
        amount: 0,
        period: 'monthly',
        month: new Date().getMonth() + 1,
        year: currentYear,
      });
    }
  }, [open, budget, reset, currentYear]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: budget._id,
          payload: { amount: data.amount },
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const mutationError = createMutation.error || updateMutation.error;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit budget' : 'Create budget'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEdit && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                {...register('categoryId')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Overall budget</option>
                {expenseCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Period</label>
              <select
                {...register('period')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {period === 'monthly' && (
              <div>
                <label className="mb-1 block text-sm font-medium">Month</label>
                <Input
                  type="number"
                  {...register('month', { valueAsNumber: true })}
                  error={errors.month?.message}
                  min={1}
                  max={12}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Year</label>
              <Input
                type="number"
                {...register('year', { valueAsNumber: true })}
                error={errors.year?.message}
                min={2000}
                max={2100}
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Amount</label>
          <Input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            error={errors.amount?.message}
            min={0.01}
          />
        </div>

        {mutationError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
            {getErrorMessage(mutationError, isEdit ? 'Failed to update budget' : 'Failed to create budget')}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
