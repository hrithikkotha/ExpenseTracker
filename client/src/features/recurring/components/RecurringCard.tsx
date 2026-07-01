import { Clock, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
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

export function RecurringCard({ recurring, onClick }: RecurringCardProps) {
  const isIncome = recurring.type === 'income';
  const nextDate = new Date(recurring.nextOccurrence).toLocaleDateString();

  return (
    <button
      onClick={onClick}
      className="w-full p-4 border rounded-lg hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${recurring.category.color}20` }}
          >
            <span className="text-xl">{recurring.category.icon}</span>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold">{recurring.category.name}</h3>
            <p className="text-sm text-muted-foreground">
              {FREQUENCY_LABELS[recurring.frequency]}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-lg font-bold flex items-center gap-1 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
            {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatCurrency(recurring.amount, 'USD')}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle menu
            }}
            className="mt-1 p-1 hover:bg-muted rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Next: {nextDate}</span>
        {!recurring.isActive && (
          <span className="ml-2 px-2 py-0.5 bg-muted text-xs rounded">Inactive</span>
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
