import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getCurrencySymbol } from '@/lib/currencies';
import { useAccounts } from '@/features/accounts/hooks';
import { useCreateTransaction, useTransactions } from '@/features/transactions/hooks';

const quickAddSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than 0'),
  accountId: z.string().min(1, 'Account is required'),
  purpose: z.string().min(1, 'Purpose is required').max(100, 'Purpose must be 100 characters or less'),
  note: z.string().optional(),
  date: z.string(),
});

type QuickAddInput = z.infer<typeof quickAddSchema>;

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddSheet({ open, onOpenChange }: QuickAddSheetProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const { user } = useAuth();
  const currencySymbol = getCurrencySymbol(user?.currency || 'INR');
  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<QuickAddInput>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedAccountId = watch('accountId');
  const selectedAccount = accounts.find(a => a._id === selectedAccountId);

  // Fetch recent transactions for purpose suggestions
  const { data: recentTransactions } = useTransactions({ sort: '-date', page: 1, limit: 100 });

  // Extract unique purposes from recent transactions
  const allPurposes = useMemo(() => {
    if (!recentTransactions?.items) return [];
    const purposeSet = new Set(recentTransactions.items.map(t => t.purpose));
    return Array.from(purposeSet).sort();
  }, [recentTransactions]);

  // Purpose autocomplete state
  const [purposeInput, setPurposeInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const purposeInputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!purposeInput) return [];
    const input = purposeInput.toLowerCase();
    return allPurposes.filter(p => p.toLowerCase().includes(input)).slice(0, 5);
  }, [purposeInput, allPurposes]);

  // Handle purpose selection from suggestions
  const selectPurpose = (purpose: string) => {
    setPurposeInput(purpose);
    setValue('purpose', purpose);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Handle keyboard navigation
  const handlePurposeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      selectPurpose(filteredSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Reset form and autocomplete when sheet closes
  useEffect(() => {
    if (!open) {
      setPurposeInput('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  }, [open]);

  const onSubmit = async (data: QuickAddInput) => {
    try {
      const payload = {
        type: data.type,
        amount: data.amount,
        accountId: data.accountId,
        purpose: data.purpose,
        note: data.note || undefined,
        date: new Date(data.date).toISOString(),
      };
      await createTransaction.mutateAsync(payload);
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create transaction: ${errorMessage}`);
    }
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
      <div className="fixed left-0 right-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Add Transaction</h2>
            <p className="text-xs text-muted-foreground">Record your income or expense</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="touch-target rounded-full hover:bg-muted transition-colors p-2"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setValue('type', 'expense');
                }}
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
                onClick={() => {
                  setType('income');
                  setValue('type', 'income');
                }}
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
              <label className="block text-sm font-medium mb-2 text-foreground">Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
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
                <label className="text-sm font-semibold text-foreground">Select Account *</label>
              </div>
              <select
                {...register('accountId')}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="" className="text-muted-foreground">Choose account...</option>
                {activeAccounts.map((account) => (
                  <option key={account._id} value={account._id} className="text-foreground">
                    {account.icon} {account.name} ({currencySymbol}{account.currentBalance.toFixed(2)})
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Current balance: {currencySymbol}{selectedAccount.currentBalance.toFixed(2)}
                </div>
              )}
              {errors.accountId && (
                <p className="mt-1 text-sm text-destructive">{errors.accountId.message}</p>
              )}
              {activeAccounts.length === 0 && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
                  ⚠️ Please create an account first in the Accounts page
                </p>
              )}
            </div>

            {/* Purpose - REQUIRED with Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2 text-foreground">Purpose *</label>
              <input
                ref={purposeInputRef}
                type="text"
                value={purposeInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setPurposeInput(value);
                  setValue('purpose', value);
                  setShowSuggestions(value.length > 0);
                  setSelectedSuggestionIndex(-1);
                }}
                onKeyDown={handlePurposeKeyDown}
                onFocus={() => purposeInput.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="e.g., Groceries, Salary, Rent..."
                maxLength={100}
                autoComplete="off"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border-2 border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => selectPurpose(suggestion)}
                      className={cn(
                        "w-full text-left px-4 py-2 hover:bg-muted transition-colors",
                        index === selectedSuggestionIndex && "bg-muted"
                      )}
                    >
                      <span className="text-sm text-foreground">{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}

              {errors.purpose && (
                <p className="mt-1 text-sm text-destructive">{errors.purpose.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Date</label>
              <input
                type="date"
                {...register('date')}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>

            {/* Note - Optional description */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Note (Optional)</label>
              <textarea
                {...register('note')}
                rows={3}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-background text-foreground"
                placeholder="Additional details about this transaction..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={activeAccounts.length === 0 || createTransaction.isPending}
              className={cn(
                "w-full py-4 rounded-lg font-semibold text-lg transition-colors",
                type === 'expense'
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white",
                (activeAccounts.length === 0 || createTransaction.isPending) && "opacity-50 cursor-not-allowed"
              )}
            >
              {createTransaction.isPending ? 'Adding...' : type === 'expense' ? 'Add Expense' : 'Add Income'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
