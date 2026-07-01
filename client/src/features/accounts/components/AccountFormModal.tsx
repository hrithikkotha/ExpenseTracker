import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AccountType, Account } from '../types';
import { useCreateAccount, useUpdateAccount } from '../hooks';

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['cash', 'bank', 'credit_card', 'debit_card', 'digital_wallet', 'savings', 'investment', 'loan', 'custom']),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  openingBalance: z.number(),
  includeInNetWorth: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  notes: z.string().optional(),
});

type AccountFormInput = z.infer<typeof accountSchema>;

interface AccountFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'digital_wallet', label: 'Digital Wallet' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
  { value: 'custom', label: 'Custom' },
];

const DEFAULT_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export function AccountFormModal({ open, onOpenChange, account }: AccountFormModalProps) {
  const isEdit = !!account;
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: account || {
      type: 'cash' as AccountType,
      icon: '💵',
      color: DEFAULT_COLORS[0],
      currency: 'USD',
      openingBalance: 0,
      includeInNetWorth: true,
      isDefault: false,
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: AccountFormInput) => {
    try {
      if (isEdit) {
        await updateAccount.mutateAsync({ id: account._id, input: data });
      } else {
        await createAccount.mutateAsync(data);
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">
              {isEdit ? 'Edit Account' : 'Create Account'}
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="touch-target rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Account Name</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Chase Checking"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Account Type</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium mb-2">Icon (Emoji)</label>
                <input
                  {...register('icon')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-2xl"
                  placeholder="💵"
                  maxLength={2}
                />
                {errors.icon && (
                  <p className="mt-1 text-sm text-destructive">{errors.icon.message}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('color', color)}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all',
                        selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <input
                  {...register('currency')}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                  placeholder="USD"
                  maxLength={3}
                />
                {errors.currency && (
                  <p className="mt-1 text-sm text-destructive">{errors.currency.message}</p>
                )}
              </div>

              {/* Opening Balance */}
              <div>
                <label className="block text-sm font-medium mb-2">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('openingBalance', { valueAsNumber: true })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('includeInNetWorth')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Include in net worth</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('isDefault')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Set as default account</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Add any notes..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={createAccount.isPending || updateAccount.isPending}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isEdit ? 'Update Account' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
