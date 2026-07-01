import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Wallet, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccounts } from '@/features/accounts/hooks';

const quickAddSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  accountId: z.string().min(1, 'Account is required'),
  note: z.string().optional(),
  date: z.date(),
});

type QuickAddInput = z.infer<typeof quickAddSchema>;

interface ImprovedQuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImprovedQuickAddSheet({ open, onOpenChange }: ImprovedQuickAddSheetProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const { data: accounts = [] } = useAccounts();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<QuickAddInput>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
    },
  });

  const selectedAccountId = watch('accountId');
  const selectedAccount = accounts.find(a => a._id === selectedAccountId);

  const onSubmit = async (data: QuickAddInput) => {
    console.log('Quick add transaction:', data);
    // TODO: Implement transaction creation
    onOpenChange(false);
    reset();
  };

  if (!open) return null;

  const activeAccounts = accounts.filter(a => !a.isArchived);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed left-0 right-0 bottom-0 z-50',
          'bg-background rounded-t-3xl',
          'shadow-2xl',
          'max-h-[85vh] overflow-hidden',
          'transition-transform duration-300',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Add Transaction</h2>
              <p className="text-xs text-muted-foreground">Record your income or expense</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="touch-target rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Type Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={cn(
                    'flex-1 py-3 rounded-lg font-medium transition-colors',
                    type === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={cn(
                    'flex-1 py-3 rounded-lg font-medium transition-colors',
                    type === 'income'
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  Income
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              {/* Account Selector - PROMINENT */}
              <div className="bg-muted/50 p-4 rounded-lg border-2 border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-5 h-5 text-primary" />
                  <label className="text-sm font-semibold">Select Account *</label>
                </div>
                <select
                  {...register('accountId')}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="">Choose account...</option>
                  {activeAccounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.icon} {account.name} (${account.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Current balance: ${selectedAccount.currentBalance.toFixed(2)}
                  </div>
                )}
                {errors.accountId && (
                  <p className="mt-1 text-sm text-destructive">{errors.accountId.message}</p>
                )}
                {activeAccounts.length === 0 && (
                  <p className="mt-2 text-sm text-orange-600">
                    ⚠️ Please create an account first in the Accounts page
                  </p>
                )}
              </div>

              {/* Category Selector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="w-4 h-4" />
                  <label className="text-sm font-medium">Category *</label>
                </div>
                <select
                  {...register('categoryId')}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  {/* TODO: Load categories dynamically */}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-destructive">{errors.categoryId.message}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  {...register('date', { valueAsDate: true })}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium mb-2">Note (Optional)</label>
                <textarea
                  {...register('note')}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Add a note..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={activeAccounts.length === 0}
                className={cn(
                  "w-full py-4 rounded-lg font-semibold text-lg transition-colors",
                  type === 'expense'
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white",
                  activeAccounts.length === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                {type === 'expense' ? 'Add Expense' : 'Add Income'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
