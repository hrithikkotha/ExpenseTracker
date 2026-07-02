import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import type { CategoryType } from '../../categories/category.types';
import type { TransactionFilters } from '../transaction.types';

interface Props {
  filters: TransactionFilters;
  search: string;
  onSearchChange: (value: string) => void;
  onPatch: (patch: Partial<TransactionFilters>) => void;
  onReset: () => void;
}

const selectClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900';

export default function TransactionFilterBar({
  filters,
  search,
  onSearchChange,
  onPatch,
  onReset,
}: Props) {
  const hasActiveFilters =
    !!filters.type ||
    !!search;

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Input
          label="Search purpose or note"
          type="search"
          placeholder="e.g. Groceries, Salary..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Type
        </label>
        <select
          className={`mt-1 ${selectClass}`}
          value={filters.type ?? ''}
          onChange={(e) =>
            onPatch({
              type: (e.target.value || undefined) as CategoryType | undefined,
            })
          }
        >
          <option value="">All</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      {hasActiveFilters && (
        <div className="flex items-end lg:col-span-3">
          <Button variant="ghost" onClick={onReset}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
