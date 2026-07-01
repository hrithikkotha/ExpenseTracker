import { forwardRef, type SelectHTMLAttributes } from 'react';
import { useCategories } from '../hooks';
import type { CategoryType } from '../category.types';

interface CategorySelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  categoryType?: CategoryType;
  label?: string;
  error?: string;
  placeholder?: string;
}

/**
 * Reusable category picker backed by the categories query. Filtered by type
 * when provided. Used by transaction/budget forms in later phases.
 */
const CategorySelect = forwardRef<HTMLSelectElement, CategorySelectProps>(
  function CategorySelect(
    { categoryType, label, error, placeholder, id, className = '', ...rest },
    ref,
  ) {
    const { data: categories = [], isLoading } = useCategories(categoryType);
    const selectId = id ?? rest.name;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={isLoading || rest.disabled}
          aria-invalid={!!error}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60',
            'dark:bg-gray-900 dark:text-gray-100',
            error
              ? 'border-red-400 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-700',
            className,
          ].join(' ')}
          {...rest}
        >
          <option value="">
            {isLoading ? 'Loading…' : (placeholder ?? 'Select a category')}
          </option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

export default CategorySelect;
