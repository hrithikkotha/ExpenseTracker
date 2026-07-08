import { useState } from 'react';
import { RefreshCw, Plus, SkipForward, DollarSign, Pause, Play, Trash2, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getCurrencySymbol } from '@/lib/currencies';
import {
  useRecurringTransactions,
  useSkipNextOccurrence,
  useSetOverrideAmount,
  useUpdateRecurringTransaction,
  useDeleteRecurringTransaction,
} from '@/features/recurring/hooks';
import type { RecurringTransaction } from '@/features/recurring/types';
import { QuickAddSheet } from '@/components/transactions/QuickAddSheet';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function OverrideAmountModal({
  recurring,
  onClose,
  currencySymbol,
}: {
  recurring: RecurringTransaction;
  onClose: () => void;
  currencySymbol: string;
}) {
  const [amount, setAmount] = useState(
    recurring.nextOverrideAmount?.toString() ?? recurring.amount.toString()
  );
  const setOverride = useSetOverrideAmount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    await setOverride.mutateAsync({ id: recurring._id, amount: numAmount });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold mb-1">Override Next Amount</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set a one-time amount for the next occurrence of <strong>{recurring.purpose}</strong>.
          It will revert to {currencySymbol}{recurring.amount.toFixed(2)} afterward.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">{currencySymbol}</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xl font-bold border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={setOverride.isPending}
              className="flex-1 py-3 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {setOverride.isPending ? 'Saving...' : 'Set Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecurringDetailCard({ recurring, currencySymbol }: { recurring: RecurringTransaction; currencySymbol: string }) {
  const [showOverride, setShowOverride] = useState(false);
  const skipNext = useSkipNextOccurrence();
  const updateRecurring = useUpdateRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();

  const isIncome = recurring.type === 'income';
  const nextDate = new Date(recurring.nextOccurrence).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const activeDays = recurring.daysOfWeek?.length > 0
    ? recurring.daysOfWeek.map(d => DAY_LABELS[d]).join(', ')
    : 'Every occurrence';

  const handleTogglePause = () => {
    updateRecurring.mutate({ id: recurring._id, input: { isActive: !recurring.isActive } });
  };

  const handleDelete = () => {
    if (confirm(`Delete recurring transaction "${recurring.purpose}"? This will not remove past transactions.`)) {
      deleteRecurring.mutate(recurring._id);
    }
  };

  return (
    <>
      {showOverride && (
        <OverrideAmountModal
          recurring={recurring}
          onClose={() => setShowOverride(false)}
          currencySymbol={currencySymbol}
        />
      )}

      <div className={cn(
        'rounded-2xl border border-border bg-card p-5 space-y-4 transition-all',
        !recurring.isActive && 'opacity-60'
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              isIncome ? 'bg-green-500/10' : 'bg-red-500/10'
            )}>
              {isIncome
                ? <TrendingUp className="w-6 h-6 text-green-600" />
                : <TrendingDown className="w-6 h-6 text-red-600" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate text-base">{recurring.purpose}</h3>
              <p className="text-sm text-muted-foreground">{recurring.account.name}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={cn('text-xl font-bold', isIncome ? 'text-green-600' : 'text-red-600')}>
              {isIncome ? '+' : '-'}{currencySymbol}{recurring.amount.toFixed(2)}
            </div>
            {!recurring.isActive && (
              <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-full">Paused</span>
            )}
          </div>
        </div>

        {/* Schedule Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Frequency</p>
            <p className="font-medium">{FREQUENCY_LABELS[recurring.frequency]}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Time</p>
            <p className="font-medium">{recurring.executionTime}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Active Days</p>
            <p className="font-medium text-xs">{activeDays}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Next Occurrence</p>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary" />
              <p className="font-medium text-xs">{nextDate}</p>
            </div>
          </div>
        </div>

        {/* Override Badge */}
        {recurring.nextOverrideAmount != null && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <span className="text-yellow-700 dark:text-yellow-400">
              Next amount overridden to{' '}
              <strong>{currencySymbol}{recurring.nextOverrideAmount.toFixed(2)}</strong>
            </span>
          </div>
        )}

        {/* Note */}
        {recurring.note && (
          <p className="text-sm text-muted-foreground italic">"{recurring.note}"</p>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => skipNext.mutate(recurring._id)}
            disabled={skipNext.isPending || !recurring.isActive}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium disabled:opacity-40"
          >
            <SkipForward className="w-4 h-4" />
            Skip Next
          </button>
          <button
            onClick={() => setShowOverride(true)}
            disabled={!recurring.isActive}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium disabled:opacity-40"
          >
            <DollarSign className="w-4 h-4" />
            Override Amount
          </button>
          <button
            onClick={handleTogglePause}
            disabled={updateRecurring.isPending}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
              recurring.isActive
                ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
            )}
          >
            {recurring.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {recurring.isActive ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteRecurring.isPending}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

export default function RecurringPage() {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showInactive, setShowInactive] = useState(true); // default to true so react-query fetches everything
  const { user } = useAuth();
  const currencySymbol = getCurrencySymbol(user?.currency || 'INR');
  const { data: recurringList = [], isLoading } = useRecurringTransactions(true); // always fetch both active and inactive

  const active = recurringList.filter(r => r.isActive);
  const inactive = recurringList.filter(r => !r.isActive);


  return (
    <>
      <QuickAddSheet open={showAddSheet} onOpenChange={setShowAddSheet} />

      <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Recurring</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Automatically track on a schedule
            </p>
          </div>
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-primary text-primary-foreground rounded-xl text-xs md:text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recurringList.length === 0 && (
          <div className="text-center py-12 md:py-16 space-y-4 bg-muted/20 rounded-2xl p-6 border border-dashed border-border">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base md:text-lg">No recurring transactions</h3>
              <p className="text-muted-foreground text-xs md:text-sm mt-1 max-w-sm mx-auto">
                Set up a recurring transaction to automatically track regular income or expenses.
              </p>
            </div>
          </div>
        )}

        {/* Active transactions */}
        {active.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active ({active.length})</h2>
            <div className="space-y-3">
              {active.map(r => (
                <RecurringDetailCard key={r._id} recurring={r} currencySymbol={currencySymbol} />
              ))}
            </div>
          </div>
        )}

        {/* Inactive toggle and list */}
        {inactive.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowInactive(prev => !prev)}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span>{showInactive ? '▼' : '▶'}</span>
              <span>Paused ({inactive.length})</span>
            </button>
            {showInactive && (
              <div className="space-y-3">
                {inactive.map(r => (
                  <RecurringDetailCard key={r._id} recurring={r} currencySymbol={currencySymbol} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
