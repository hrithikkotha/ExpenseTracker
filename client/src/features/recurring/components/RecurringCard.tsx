import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

import { formatCurrency } from '@/lib/utils';
import type { RecurringTransaction } from '../types';

interface RecurringCardProps {
  recurring: RecurringTransaction;
  onClick?: () => void;
}

const FREQUENCY_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RecurringCard({ recurring, onClick }: RecurringCardProps) {
  const isIncome = recurring.type === 'income';
  const nextDate = new Date(recurring.nextOccurrence).toLocaleDateString();
  const activeDays = recurring.daysOfWeek?.length > 0
    ? recurring.daysOfWeek.map(d => DAY_LABELS[d]).join(', ')
    : 'Every day';

  return (
    <button
      onClick={onClick}
      className="w-full p-4 border border-border rounded-xl hover:shadow-md transition-all text-left bg-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {isIncome ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{recurring.purpose}</h3>
            <p className="text-sm text-muted-foreground">
              {FREQUENCY_LABELS[recurring.frequency]} · {recurring.executionTime}
            </p>
            <p className="text-xs text-muted-foreground">{activeDays}</p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(recurring.amount, 'INR')}
          </div>
          {!recurring.isActive && (
            <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">Paused</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Next: {nextDate}</span>
        {recurring.nextOverrideAmount != null && (
          <span className="ml-2 px-2 py-0.5 bg-yellow-500/10 text-yellow-600 text-xs rounded">
            Override: {formatCurrency(recurring.nextOverrideAmount, 'INR')}
          </span>
        )}
      </div>

      {recurring.note && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
          {recurring.note}
        </p>
      )}
    </button>
  );
}

