import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../lib/format';
import type { CategoryBreakdown } from '../analytics.types';

interface Props {
  categories: CategoryBreakdown[];
}

export default function CategoryPieChart({ categories }: Props) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Expense by Category
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          No expense data yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Expense by Category
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={categories}
            dataKey="total"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            outerRadius={80}
          >
            {categories.map((c) => (
              <Cell key={c.categoryId} fill={c.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v) || 0, currency)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
