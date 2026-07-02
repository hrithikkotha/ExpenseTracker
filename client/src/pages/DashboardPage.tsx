import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import KPICards from '../features/analytics/components/KPICards';
import IncomeExpenseTrend from '../features/analytics/components/IncomeExpenseTrend';
import CategoryPieChart from '../features/analytics/components/CategoryPieChart';
import { useSummary, useTrends } from '../features/analytics/hooks';
import { useTransactions } from '../features/transactions/hooks';
import { formatCurrency, formatDate } from '../lib/format';
import { getErrorMessage } from '../lib/apiError';
import type { Transaction } from '../features/transactions/transaction.types';

type Range = 'month' | 'year' | 'all';

export default function DashboardPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';
  const [range, setRange] = useState<Range>('month');

  const summaryFilters = useMemo(() => {
    const now = new Date();
    if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (range === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    return {};
  }, [range]);

  const trendsFilters = useMemo(() => {
    if (range === 'year' || range === 'all') {
      return { period: 'yearly' as const };
    }
    return { period: 'monthly' as const };
  }, [range]);

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorObj,
  } = useSummary(summaryFilters);

  const {
    data: trends,
    isLoading: trendsLoading,
    isError: trendsError,
    error: trendsErrorObj,
  } = useTrends(trendsFilters);

  const {
    data: recentData,
    isLoading: recentLoading,
    isError: recentError,
    error: recentErrorObj,
  } = useTransactions({ sort: '-date', page: 1, limit: 5 });

  const recent = recentData?.items ?? [];

  const isLoading = summaryLoading || trendsLoading || recentLoading;
  const error = summaryError || trendsError || recentError;
  const errorMsg =
    getErrorMessage(summaryErrorObj) ||
    getErrorMessage(trendsErrorObj) ||
    getErrorMessage(recentErrorObj);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2 rounded-lg border border-gray-200 p-1 dark:border-gray-800">
          {(['month', 'year', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={[
                'rounded px-3 py-1 text-sm font-medium transition-colors',
                range === r
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {r === 'month' ? 'This Month' : r === 'year' ? 'This Year' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12 text-brand-600">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {errorMsg || 'Failed to load dashboard'}
        </p>
      )}

      {!isLoading && !error && summary && trends && (
        <div className="space-y-6">
          <KPICards summary={summary} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <IncomeExpenseTrend trends={trends} />
            <CategoryPieChart categories={summary.expenseByCategory} />
          </div>

          {recent.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Recent Transactions
              </h2>
              <ul className="space-y-3">
                {recent.map((t: Transaction) => (
                  <li
                    key={t._id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {t.purpose}
                        </p>
                        {t.note && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {t.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(t.date)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={[
                        'text-sm font-medium',
                        t.type === 'income' ? 'text-green-600' : 'text-red-600',
                      ].join(' ')}
                    >
                      {t.type === 'income' ? '+' : '−'}
                      {formatCurrency(t.amount, currency)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
