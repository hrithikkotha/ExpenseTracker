import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import TransactionFormModal from '../features/transactions/components/TransactionFormModal';
import {
  useTransactions,
  useDeleteTransaction,
} from '../features/transactions/hooks';
import { getErrorMessage } from '../lib/apiError';
import { formatCurrency, formatDate } from '../lib/format';
import type { Transaction } from '../features/transactions/transaction.types';

export default function TransactionsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';

  const { data: transactions = [], isLoading, isError, error } =
    useTransactions();
  const deleteMutation = useDeleteTransaction();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

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
    // Optimistic — close immediately; rollback handled in the hook on error.
    deleteMutation.mutate(toDelete._id);
    setToDelete(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <Button onClick={openCreate}>+ Add transaction</Button>
      </div>

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
            No transactions yet.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            Add your first transaction
          </Button>
        </div>
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Amount</th>
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
                      t.type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600',
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
