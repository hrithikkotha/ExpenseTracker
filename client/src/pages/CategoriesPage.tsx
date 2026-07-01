import { useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CategoryFormModal from '../features/categories/components/CategoryFormModal';
import { useCategories, useDeleteCategory } from '../features/categories/hooks';
import { getErrorMessage } from '../lib/apiError';
import type { Category, CategoryType } from '../features/categories/category.types';

function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: `${category.color}22` }}
        >
          {category.icon}
        </span>
        <span className="text-sm font-medium">{category.name}</span>
        {category.isDefault && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            Default
          </span>
        )}
      </div>
      {!category.isDefault && (
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => onEdit(category)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={() => onDelete(category)}
          >
            Delete
          </Button>
        </div>
      )}
    </li>
  );
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading, isError, error } = useCategories();
  const deleteMutation = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const by = (t: CategoryType) => categories.filter((c) => c.type === t);
    return { expense: by('expense'), income: by('income') };
  }, [categories]);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(toDelete._id);
      setToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            System defaults are shared; your own categories can be edited.
          </p>
        </div>
        <Button onClick={openCreate}>+ New category</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12 text-brand-600">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {isError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
          {getErrorMessage(error, 'Failed to load categories')}
        </p>
      )}

      {!isLoading && !isError && (
        <div className="space-y-8">
          {(['expense', 'income'] as const).map((type) => (
            <section key={type}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                {type === 'expense' ? 'Expense' : 'Income'} categories
              </h2>
              <ul className="space-y-2">
                {grouped[type].map((c) => (
                  <CategoryRow
                    key={c._id}
                    category={c}
                    onEdit={openEdit}
                    onDelete={setToDelete}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Delete category"
        message={
          deleteError ??
          `Delete "${toDelete?.name}"? This can’t be undone.`
        }
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => {
          setToDelete(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
