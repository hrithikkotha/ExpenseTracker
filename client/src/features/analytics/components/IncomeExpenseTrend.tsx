import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../lib/format';
import type { Trends } from '../analytics.types';

interface Props {
  trends: Trends;
}

export default function IncomeExpenseTrend({ trends }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Income vs Expense
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={trends}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={(v) => formatCurrency(Number(v) || 0, currency).replace(/\.\d+/, '')}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(v) => formatCurrency(Number(v) || 0, currency)}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            fill="url(#colorIncome)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            fill="url(#colorExpense)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
