import { Account } from '../types';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const isNegative = account.currentBalance < 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-lg border-2 transition-all',
        'hover:shadow-md active:scale-[0.98]',
        'text-left'
      )}
      style={{ borderColor: account.color }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${account.color}20` }}
          >
            {account.icon}
          </div>
          <div>
            <h3 className="font-semibold">{account.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {account.type.replace('_', ' ')}
            </p>
          </div>
        </div>
        {account.isDefault && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
            Default
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
        <p
          className={cn(
            'text-2xl font-bold',
            isNegative ? 'text-destructive' : 'text-foreground'
          )}
        >
          {formatCurrency(account.currentBalance, account.currency)}
        </p>
      </div>

      {account.notes && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {account.notes}
        </p>
      )}
    </button>
  );
}
