import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import BudgetFormModal from '../features/budgets/components/BudgetFormModal';
import { useBudgets, useDeleteBudget } from '../features/budgets/hooks';
import { formatCurrency } from '../lib/format';
import { getErrorMessage } from '../lib/apiError';
import type { Budget } from '../features/budgets/budget.types';

function BudgetCard({
  budget,
  currency,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const isOver = pct > 100;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold">
            {budget.category?.name ?? 'Overall Budget'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {budget.period === 'monthly' ? `${budget.year}/${budget.month}` : budget.year}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {formatCurrency(budget.spent, currency)} of{' '}
            {formatCurrency(budget.amount, currency)}
          </span>
          <span className={isOver ? 'font-semibold text-red-600' : ''}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <div
          className={`h-full transition-all ${
            isOver ? 'bg-red-600' : 'bg-brand-600'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'USD';

  const { data: budgets = [], isLoading, isError, error } = useBudgets();
  const deleteMutation = useDeleteBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [toDelete, setToDelete] = useState<Budget | null>(null);

  const openCreateForm = () => {
    setEditingBudget(null);
    setFormOpen(true);
  };

  const openEditForm = (budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingBudget(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete._id);
    setToDelete(null);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Budgets</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track spending against limits.
          </p>
        </div>
        <Button onClick={openCreateForm}>+ New budget</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12 text-brand-600">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {getErrorMessage(error, 'Failed to load budgets')}
        </p>
      )}

      {!isLoading && !isError && budgets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No budgets yet.
          </p>
          <Button className="mt-4" onClick={openCreateForm}>Create your first budget</Button>
        </div>
      )}

      {!isLoading && !isError && budgets.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {budgets.map((b) => (
            <BudgetCard
              key={b._id}
              budget={b}
              currency={currency}
              onEdit={() => openEditForm(b)}
              onDelete={() => setToDelete(b)}
            />
          ))}
        </div>
      )}

      <BudgetFormModal
        open={formOpen}
        onClose={closeForm}
        budget={editingBudget ?? undefined}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete budget"
        message={`Delete the budget for "${toDelete?.category?.name ?? 'Overall'}"? This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
