import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pencil, Trash2 } from 'lucide-react';
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
    <div className="mx-auto max-w-5xl pb-20 md:pb-4">
      <div className="mb-6 flex items-center justify-between px-4 md:px-0">
        <h1 className="text-xl font-semibold">Transactions</h1>
        {/* Removed "Add transaction" button - using bottom nav + button instead */}
      </div>

      <div className="px-4 md:px-0">
        <TransactionFilterBar
          filters={filters}
          search={search}
          onSearchChange={setSearch}
          onPatch={patchFilter}
          onReset={resetFilters}
        />
      </div>

      <div className="px-4 md:px-0">
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
          className={`overflow-x-auto rounded-2xl border border-gray-200 transition-opacity dark:border-gray-800 ${
            isFetching ? 'opacity-60' : ''
          }`}
        >
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-left text-xs text-gray-400 dark:bg-gray-900">
              <tr>
                <SortHeader
                  label="Date"
                  field="date"
                  sort={filters.sort ?? '-date'}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 uppercase tracking-wide">Purpose</th>
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
              {transactions.map((t: Transaction) => (
                <tr
                  key={t._id}
                  className="bg-white hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-900"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                    {formatDate(t.date)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {t.purpose}
                  </td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-gray-500 dark:text-gray-400">
                    {t.note || '-'}
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
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => openEdit(t)}
                        className="group relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                        aria-label="Edit transaction"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-white drop-shadow-sm" />
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                      <button
                        onClick={() => setToDelete(t)}
                        className="group relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 dark:from-red-600 dark:to-red-700 dark:hover:from-red-500 dark:hover:to-red-600 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                        aria-label="Delete transaction"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-white drop-shadow-sm" />
                        <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </button>
                    </div>
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
      </div>

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
