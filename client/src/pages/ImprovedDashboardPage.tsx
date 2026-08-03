import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSummary, useTrends } from '../features/analytics/hooks';
import { useTransactions } from '../features/transactions/hooks';
import { formatCurrency, formatDate, getCurrencySymbol } from '../lib/format';
import { getErrorMessage } from '../lib/apiError';
import type { Transaction } from '../features/transactions/transaction.types';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

type Range = 'week' | 'month' | 'year' | 'all';

const RADIAN = Math.PI / 180;

function ImprovedDashboardPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';
  const [range, setRange] = useState<Range>('month');

  const summaryFilters = useMemo(() => {
    const now = new Date();
    if (range === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return { from: start.toISOString(), to: now.toISOString() };
    }
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

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorObj,
  } = useSummary(summaryFilters);

  const {
    data: trends,
    isLoading: trendsLoading,
  } = useTrends({ period: 'monthly' });

  const {
    data: recentData,
    isLoading: recentLoading,
  } = useTransactions({ sort: '-date', page: 1, limit: 10 });

  // Fetch all transactions for pie chart (max limit is 100 per backend validator)
  // Apply the same date filters as the summary
  const transactionFilters = useMemo(() => {
    const filters: {
      sort: '-date';
      page: number;
      limit: number;
      from?: string;
      to?: string;
    } = {
      sort: '-date',
      page: 1,
      limit: 100,
    };
    if (summaryFilters.from) filters.from = summaryFilters.from;
    if (summaryFilters.to) filters.to = summaryFilters.to;
    return filters;
  }, [summaryFilters]);

  const {
    data: allTransactionsData,
  } = useTransactions(transactionFilters);

  const recent = recentData?.items ?? [];
  const allTransactions = allTransactionsData?.items ?? [];
  const isLoading = summaryLoading || trendsLoading || recentLoading;

  // Calculate expense distribution by purpose
  const expenseDistribution = useMemo(() => {
    const expenses = allTransactions.filter(t => t.type === 'expense');
    const purposeMap = new Map<string, number>();

    expenses.forEach(t => {
      const current = purposeMap.get(t.purpose) || 0;
      purposeMap.set(t.purpose, current + t.amount);
    });

    return Array.from(purposeMap.entries())
      .map(([purpose, amount]) => ({ purpose, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 expenses
  }, [allTransactions]);

  const [selectedExpense, setSelectedExpense] = useState<{ purpose: string; amount: number } | null>(null);

  // Top 5 expense categories
  const topCategories = useMemo(() => {
    if (!summary?.expenseByCategory) return [];
    return summary.expenseByCategory.slice(0, 5);
  }, [summary]);

  // Calculate spending patterns (daily average)
  const dailyAverage = useMemo(() => {
    if (!summary) return 0;
    let days = 30;
    if (range === 'week') {
      days = 7;
    } else if (range === 'month') {
      days = 30;
    } else if (range === 'year') {
      days = 365;
    } else if (range === 'all') {
      if (allTransactions.length > 0) {
        const oldestDate = new Date(allTransactions[allTransactions.length - 1].date);
        const diffTime = Math.abs(new Date().getTime() - oldestDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        days = diffDays > 0 ? diffDays : 1;
      } else {
        days = 1;
      }
    }
    return summary.totalExpense / days;
  }, [summary, range, allTransactions]);

  const pieColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

  // Only label slices big enough to have room; smaller slivers rely on the tooltip/list instead.
  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name, payload } = props;
    if (percent < 0.05) return null;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="currentColor"
        className="text-xs text-foreground"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {name || payload?.purpose}
      </text>
    );
  };

  const renderPieLabelLine = (props: any) => {
    const { points, percent } = props;
    if (percent < 0.05 || !points?.length) return <></>;
    const [start, end] = points;
    return (
      <path
        d={`M${start.x},${start.y}L${end.x},${end.y}`}
        stroke="currentColor"
        strokeWidth={1}
        fill="none"
        className="text-muted-foreground"
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-4">
      {/* Header - Desktop only (mobile uses MobileAppLayout header) */}
      <div className="hidden md:flex flex-col gap-4 p-4 md:p-6 border-b bg-background sticky top-0 z-30 backdrop-blur-sm bg-background/95">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Your spending insights</p>
          </div>
        </div>

        {/* Range Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'year', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${range === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'}
              `}
            >
              {r === 'week'
                ? 'Last 7 Days'
                : r === 'month'
                ? 'This Month'
                : r === 'year'
                ? 'This Year'
                : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Range Selector */}
      <div className="md:hidden flex gap-2 p-4 bg-background border-b overflow-x-auto">
        {(['week', 'month', 'year', 'all'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${range === r
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'}
            `}
          >
            {r === 'week' ? 'Week' : r === 'month' ? 'Month' : r === 'year' ? 'Year' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : summaryError ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive font-medium">Failed to load analytics</p>
            <p className="text-sm text-destructive/80 mt-1">
              {getErrorMessage(summaryErrorObj) || 'Please try again later'}
            </p>
          </div>
        ) : !summary ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Income */}
              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Income</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome, currency)}
                </p>
              </div>

              {/* Total Expense */}
              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-muted-foreground">Expense</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpense, currency)}
                </p>
              </div>

              {/* Balance */}
              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Balance</span>
                </div>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.balance, currency)}
                </p>
              </div>

              {/* Daily Average */}
              <div className="bg-card border rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-muted-foreground">Daily Avg</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(dailyAverage, currency)}
                </p>
              </div>
            </div>

            {/* Expense Distribution by Purpose */}
            {summary && summary.totalExpense > 0 && expenseDistribution.length > 0 ? (
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Expense Distribution</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseDistribution}
                          dataKey="amount"
                          nameKey="purpose"
                          cx="50%"
                          cy="50%"
                          outerRadius="70%"
                          label={renderPieLabel}
                          labelLine={renderPieLabelLine}
                          onClick={(data: any) => {
                            if (data && data.purpose && data.amount) {
                              setSelectedExpense({ purpose: data.purpose, amount: data.amount });
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {expenseDistribution.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={pieColors[index % pieColors.length]}
                              stroke={selectedExpense?.purpose === expenseDistribution[index].purpose ? '#000' : 'none'}
                              strokeWidth={selectedExpense?.purpose === expenseDistribution[index].purpose ? 3 : 0}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => formatCurrency(Number(value), currency)}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Purpose List */}
                  <div className="space-y-3">
                    {selectedExpense && (
                      <div className="mb-4 p-4 bg-primary/10 border-2 border-primary rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Selected Expense</p>
                        <p className="font-bold text-lg text-foreground">{selectedExpense.purpose}</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">
                          {formatCurrency(selectedExpense.amount, currency)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {((selectedExpense.amount / summary.totalExpense) * 100).toFixed(1)}% of total expenses
                        </p>
                      </div>
                    )}

                    {expenseDistribution.map((item, idx) => {
                      const percentage = (item.amount / summary.totalExpense) * 100;
                      return (
                        <div
                          key={idx}
                          className={`space-y-1 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedExpense?.purpose === item.purpose ? 'bg-primary/5 ring-2 ring-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedExpense(item)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.purpose}</span>
                            <span className="text-sm font-semibold">
                              {formatCurrency(item.amount, currency)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: pieColors[idx % pieColors.length],
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              summary && summary.totalExpense === 0 && (
                <div className="bg-card border rounded-xl p-6 shadow-sm text-center">
                  <PieChartIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No expense data available for the selected period</p>
                  <p className="text-sm text-muted-foreground mt-1">Add some expense transactions to see the distribution</p>
                </div>
              )
            )}

            {/* Income vs Expense Trend */}
            {trends && trends.length > 0 && (
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Income vs Expense (Last 12 Months)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
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
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="period"
                        className="text-xs"
                        tickFormatter={(value) => {
                          const [, month] = value.split('-');
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return monthNames[parseInt(month) - 1];
                        }}
                      />
                      <YAxis
                        className="text-xs"
                        tickFormatter={(v) => `${getCurrencySymbol(currency)}${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(v) => formatCurrency(Number(v), currency)}
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
              </div>
            )}

            {/* Spending Patterns - Bar Chart */}
            {topCategories.length > 0 && (
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Spending Breakdown</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCategories}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="categoryName" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `${getCurrencySymbol(currency)}${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(v) => formatCurrency(Number(v), currency)}
                      />
                      <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {recent.length > 0 && (
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
                <div className="space-y-3">
                  {recent.map((t: Transaction) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">
                            {t.purpose}
                          </p>
                          {t.note && (
                            <p className="text-xs text-muted-foreground truncate">
                              {t.note}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(t.date)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          t.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {topCategories.length === 0 && recent.length === 0 && (
              <div className="text-center py-12 bg-card border rounded-xl">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <PieChartIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
                <p className="text-muted-foreground">Start adding transactions to see your analytics</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ImprovedDashboardPage;
