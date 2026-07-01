import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const quickAddSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  accountId: z.string().min(1, 'Account is required'),
  note: z.string().optional(),
  date: z.date(),
});

type QuickAddInput = z.infer<typeof quickAddSchema>;

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuickAddInput>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      type: 'expense',
      date: new Date(),
    },
  });

  const onSubmit = async (data: QuickAddInput) => {
    console.log('Quick add transaction:', data);
    // TODO: Implement transaction creation
    onOpenChange(false);
    reset();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 md:hidden"
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
          'md:hidden',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Quick Add</h2>
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
                      ? 'bg-destructive text-destructive-foreground'
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
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-4 py-3 text-2xl font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              {/* Category Selector (Placeholder) */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
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

              {/* Account Selector (Placeholder) */}
              <div>
                <label className="block text-sm font-medium mb-2">Account</label>
                <select
                  {...register('accountId')}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select account</option>
                  {/* TODO: Load accounts dynamically */}
                </select>
                {errors.accountId && (
                  <p className="mt-1 text-sm text-destructive">{errors.accountId.message}</p>
                )}
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
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Add Transaction
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
