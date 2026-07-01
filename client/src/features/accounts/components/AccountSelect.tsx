import { useAccounts } from '../hooks';
import { Account } from '../types';

interface AccountSelectProps {
  value?: string;
  onChange: (accountId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function AccountSelect({ value, onChange, error, disabled }: AccountSelectProps) {
  const { data: accounts, isLoading } = useAccounts();

  if (isLoading) {
    return (
      <div className="w-full px-4 py-3 border rounded-lg bg-muted animate-pulse">
        Loading accounts...
      </div>
    );
  }

  const activeAccounts = accounts?.filter((a) => !a.isArchived) || [];

  return (
    <div>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
      >
        <option value="">Select account</option>
        {activeAccounts.map((account: Account) => (
          <option key={account._id} value={account._id}>
            {account.icon} {account.name} ({formatBalance(account.currentBalance, account.currency)})
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

function formatBalance(balance: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(balance);
}
