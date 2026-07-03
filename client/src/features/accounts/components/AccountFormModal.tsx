import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
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

const ICON_OPTIONS = [
  '💵', '🏦', '💳', '💰', '🪙', '💎', '🏠', '🚗',
  '🎯', '📱', '💻', '🎮', '🍕', '☕', '✈️', '🎓',
  '💼', '🏥', '🛒', '🎨', '📚', '⚡', '🔥', '💡',
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
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
    defaultValues: {
      type: 'cash' as AccountType,
      icon: '💵',
      color: DEFAULT_COLORS[0],
      currency: 'USD',
      openingBalance: 0,
      includeInNetWorth: true,
      isDefault: false,
    },
  });

  // Update form when account prop changes (for edit mode)
  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        icon: account.icon,
        color: account.color,
        currency: account.currency,
        openingBalance: account.openingBalance,
        includeInNetWorth: account.includeInNetWorth,
        isDefault: account.isDefault,
        notes: account.notes || '',
      });
    } else if (open) {
      // Reset to defaults when opening for create
      reset({
        type: 'cash' as AccountType,
        icon: '💵',
        color: DEFAULT_COLORS[0],
        currency: 'USD',
        openingBalance: 0,
        includeInNetWorth: true,
        isDefault: false,
        notes: '',
      });
    }
  }, [account, open, reset]);

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
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal - Mobile optimized with bottom sheet on small screens */}
      <div className="fixed left-0 right-0 bottom-0 md:left-1/2 md:top-1/2 z-50 w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 bg-background border-t md:border border-border md:rounded-lg rounded-t-3xl md:rounded-t-lg shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border bg-muted/30">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEdit ? 'Edit Account' : 'Create Account'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isEdit ? 'Update your account details' : 'Add a new account (Cash, Bank, Credit Card, etc.)'}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="touch-target rounded-full hover:bg-muted transition-colors p-2"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Account Name *</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-3 text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="e.g., Chase Checking"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Account Type *</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-3 text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon & Currency Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Icon Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Icon *</label>
                  <select
                    {...register('icon')}
                    className="w-full px-4 py-3 text-2xl border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  {errors.icon && (
                    <p className="mt-1 text-xs text-destructive">{errors.icon.message}</p>
                  )}
                </div>

                {/* Currency Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Currency *</label>
                  <select
                    {...register('currency')}
                    className="w-full px-4 py-3 text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.currency && (
                    <p className="mt-1 text-xs text-destructive">{errors.currency.message}</p>
                  )}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Color *</label>
                <div className="flex gap-3 flex-wrap">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setValue('color', color)}
                      className={cn(
                        'w-12 h-12 rounded-full border-4 transition-all touch-target',
                        selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Opening Balance */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Opening Balance *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('openingBalance', { valueAsNumber: true })}
                  className="w-full px-4 py-3 text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  placeholder="0.00"
                />
              </div>

              {/* Checkboxes - Larger touch targets */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <label className="flex items-center gap-3 touch-target">
                  <input
                    type="checkbox"
                    {...register('includeInNetWorth')}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span className="text-sm text-foreground">Include in net worth</span>
                </label>
                <label className="flex items-center gap-3 touch-target">
                  <input
                    type="checkbox"
                    {...register('isDefault')}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span className="text-sm text-foreground">Set as default account</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Notes (Optional)</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-4 py-3 text-base border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background text-foreground"
                  placeholder="Add any notes..."
                />
              </div>

              {/* Submit - Larger touch target */}
              <button
                type="submit"
                disabled={createAccount.isPending || updateAccount.isPending}
                className="w-full py-4 text-lg bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 touch-target"
              >
                {createAccount.isPending || updateAccount.isPending ? 'Saving...' : (isEdit ? 'Update Account' : 'Create Account')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
