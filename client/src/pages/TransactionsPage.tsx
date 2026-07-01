import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import TransactionFormModal from '../features/transactions/components/TransactionFormModal';
import TransactionFilterBar from '../features/transactions/components/TransactionFilterBar';
import {
  useTransactions,
  useDeleteTransaction,
} from '../features/transactions/hooks';
import { getErrorMessage } from '../lib/apiError';
import { formatCurrency, formatDate } from '../lib/format';
import { useDebounce } from '../lib/useDebounce';
import type {
  Transaction,
  TransactionFilters,
  TransactionSort,
} from '../features/transactions/transaction.types';

const DEFAULT_FILTERS: TransactionFilters = {
  sort: '-date',
  page: 1,
  limit: 10,
};

/** Header cell that toggles ascending/descending sort for its field. */
function SortHeader({
  label,
  field,
  sort,
  onSort,
  align = 'left',
}: {
  label: string;
  field: 'date' | 'amount';
  sort: TransactionSort;
  onSort: (field: 'date' | 'amount') => void;
  align?: 'left' | 'right';
}) {
  const active = sort === field || sort === `-${field}`;
  const arrow = !active ? '' : sort.startsWith('-') ? ' ↓' : ' ↑';
  return (
    <th className={`px-4 py-3 ${align === 'right' ? 'text-right' : ''}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`font-inherit uppercase tracking-wide ${
          active ? 'text-brand-600' : ''
        }`}
      >
        {label}
        {arrow}
      </button>
    </th>
  );
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Reset to the first page whenever the search term settles.
  useEffect(() => {
    setFilters((f) => ({ ...f, page: 1 }));
  }, [debouncedSearch]);

  const query = useMemo<TransactionFilters>(
    () => ({ ...filters, q: debouncedSearch || undefined }),
    [filters, debouncedSearch],
  );

  const { data, isLoading, isFetching, isError, error } =
    useTransactions(query);
  const deleteMutation = useDeleteTransaction();

  const transactions = data?.items ?? [];
  const meta = data?.meta;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  // Any filter change resets to page 1; page changes don't.
  const patchFilter = (patch: Partial<TransactionFilters>) =>
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  const setPage = (page: number) => setFilters((f) => ({ ...f, page }));

  const handleSort = (field: 'date' | 'amount') => {
    setFilters((f) => ({
      ...f,
      sort: f.sort === `-${field}` ? field : (`-${field}` as TransactionSort),
      page: 1,
    }));
  };

  const resetFilters = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  };

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormOpen(true);
  };
  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete._id);
    setToDelete(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <Button onClick={openCreate}>+ Add transaction</Button>
      </div>

      <TransactionFilterBar
        filters={filters}
        search={search}
        onSearchChange={setSearch}
        onPatch={patchFilter}
        onReset={resetFilters}
      />

      {isLoading && (
        <div className="flex justify-center py-12 text-brand-600">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {getErrorMessage(error, 'Failed to load transactions')}
        </p>
      )}

      {!isLoading && !isError && transactions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No transactions match your filters.
          </p>
        </div>
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <div
          className={`overflow-hidden rounded-2xl border border-gray-200 transition-opacity dark:border-gray-800 ${
            isFetching ? 'opacity-60' : ''
          }`}
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-400 dark:bg-gray-900">
              <tr>
                <SortHeader
                  label="Date"
                  field="date"
                  sort={filters.sort ?? '-date'}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 uppercase tracking-wide">Note</th>
                <SortHeader
                  label="Amount"
                  field="amount"
                  sort={filters.sort ?? '-date'}
                  onSort={handleSort}
                  align="right"
                />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {transactions.map((t) => (
                <tr
                  key={t._id}
                  className="bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden>{t.category?.icon}</span>
                      {t.category?.name ?? 'Uncategorized'}
                    </span>
                  </td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-gray-500 dark:text-gray-400">
                    {t.note}
                  </td>
                  <td
                    className={[
                      'whitespace-nowrap px-4 py-3 text-right font-medium',
                      t.type === 'income' ? 'text-green-600' : 'text-red-600',
                    ].join(' ')}
                  >
                    {t.type === 'income' ? '+' : '−'}
                    {formatCurrency(t.amount, currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => openEdit(t)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={() => setToDelete(t)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta && meta.totalPages > 1 && (
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      <TransactionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        transaction={editing}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete transaction"
        message={`Delete this ${toDelete?.type} of ${
          toDelete ? formatCurrency(toDelete.amount, currency) : ''
        }? This can’t be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
