import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../lib/format';
import type { Summary } from '../analytics.types';

interface Props {
  summary: Summary;
}

function KPICard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {trend && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{trend}</p>
      )}
    </div>
  );
}

export default function KPICards({ summary }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        label="Total Income"
        value={formatCurrency(summary.totalIncome, currency)}
      />
      <KPICard
        label="Total Expense"
        value={formatCurrency(summary.totalExpense, currency)}
      />
      <KPICard
        label="Balance"
        value={formatCurrency(summary.balance, currency)}
      />
      <KPICard
        label="Savings Rate"
        value={`${summary.savingsRate.toFixed(1)}%`}
      />
    </div>
  );
}
