import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '../../../lib/utils';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { getErrorMessage } from '../../../lib/apiError';
import { toDateInputValue } from '../../../lib/format';
import { useUpdateTransaction, useTransactions } from '../hooks';
import type { Transaction } from '../transaction.types';

const schema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .number({ error: 'Enter an amount' })
    .positive('Amount must be greater than 0'),
  purpose: z.string().min(1, 'Purpose is required').max(100),
  date: z.string().min(1, 'Pick a date'),
  note: z.string().max(280).optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction; // present = edit mode
}

export default function TransactionFormModal({
  open,
  onClose,
  transaction,
}: Props) {
  const isEdit = !!transaction;
  const update = useUpdateTransaction();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      type: transaction?.type ?? 'expense',
      amount: transaction?.amount ?? ('' as unknown as number),
      purpose: transaction?.purpose ?? '',
      date: toDateInputValue(transaction?.date),
      note: transaction?.note ?? '',
    },
  });

  // Fetch recent transactions for purpose suggestions
  const { data: recentTransactions } = useTransactions({ sort: '-date', page: 1, limit: 100 });

  // Extract unique purposes from recent transactions
  const allPurposes = useMemo(() => {
    if (!recentTransactions?.items) return [];
    const purposeSet = new Set(
      recentTransactions.items
        .map(t => t.purpose)
        .filter(p => p && typeof p === 'string' && p.trim().length > 0)
    );
    return Array.from(purposeSet).sort();
  }, [recentTransactions]);

  // Purpose autocomplete state
  const [purposeInput, setPurposeInput] = useState(transaction?.purpose ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const purposeInputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!purposeInput || !purposeInput.trim()) return [];
    const input = purposeInput.toLowerCase().trim();
    return allPurposes
      .filter(p => p && p.toLowerCase().includes(input))
      .slice(0, 5);
  }, [purposeInput, allPurposes]);

  // Handle purpose selection from suggestions
  const selectPurpose = (purpose: string) => {
    setPurposeInput(purpose);
    setValue('purpose', purpose);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Handle keyboard navigation
  const handlePurposeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      selectPurpose(filteredSuggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Update purpose input when transaction changes
  useEffect(() => {
    setPurposeInput(transaction?.purpose ?? '');
  }, [transaction]);

  const close = () => {
    setFormError(null);
    setPurposeInput('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    // Note: TransactionFormModal is ONLY for editing existing transactions
    // QuickAddSheet is used for creating new transactions
    const payload = {
      type: values.type,
      amount: values.amount,
      purpose: values.purpose,
      date: new Date(values.date).toISOString(),
      note: values.note?.trim() || undefined,
    };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: transaction._id, payload });
      }
      close();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  });

  const isSaving = update.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEdit ? 'Edit transaction' : 'New transaction'}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40">
            {formError}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            {...register('type')}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />

        {/* Purpose with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Purpose
          </label>
          <input
            ref={purposeInputRef}
            type="text"
            value={purposeInput}
            onChange={(e) => {
              const value = e.target.value;
              setPurposeInput(value);
              setValue('purpose', value);
              setShowSuggestions(value.length > 0);
              setSelectedSuggestionIndex(-1);
            }}
            onKeyDown={handlePurposeKeyDown}
            onFocus={() => purposeInput.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900"
            placeholder="e.g., Groceries, Salary, Rent..."
            maxLength={100}
            autoComplete="off"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => selectPurpose(suggestion)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                    index === selectedSuggestionIndex && "bg-gray-50 dark:bg-gray-800"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {errors.purpose && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.purpose.message}</p>
          )}
        </div>

        <Input
          label="Date"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <Input
          label="Note (optional)"
          type="text"
          error={errors.note?.message}
          {...register('note')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {isEdit ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
