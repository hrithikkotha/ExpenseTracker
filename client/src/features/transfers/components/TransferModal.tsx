import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ArrowRight } from 'lucide-react';
import { useAccounts } from '@/features/accounts/hooks';
import { useCreateTransfer } from '../hooks';

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'From account is required'),
  toAccountId: z.string().min(1, 'To account is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  note: z.string().optional(),
  date: z.date(),
});

type TransferInput = z.infer<typeof transferSchema>;

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferModal({ open, onOpenChange }: TransferModalProps) {
  const { data: accounts = [] } = useAccounts();
  const createTransfer = useCreateTransfer();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TransferInput>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      date: new Date(),
    },
  });

  const onSubmit = async (data: TransferInput) => {
    try {
      await createTransfer.mutateAsync(data);
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Failed to create transfer:', error);
    }
  };

  if (!open) return null;

  const activeAccounts = accounts.filter(a => !a.isArchived);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={() => onOpenChange(false)} />

      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Transfer Money</h2>
          <button onClick={() => onOpenChange(false)} className="touch-target rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Account</label>
              <select
                {...register('fromAccountId')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select account</option>
                {activeAccounts.map(account => (
                  <option key={account._id} value={account._id}>
                    {account.icon} {account.name}
                  </option>
                ))}
              </select>
              {errors.fromAccountId && (
                <p className="mt-1 text-sm text-destructive">{errors.fromAccountId.message}</p>
              )}
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">To Account</label>
              <select
                {...register('toAccountId')}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select account</option>
                {activeAccounts.map(account => (
                  <option key={account._id} value={account._id}>
                    {account.icon} {account.name}
                  </option>
                ))}
              </select>
              {errors.toAccountId && (
                <p className="mt-1 text-sm text-destructive">{errors.toAccountId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                {...register('date', { valueAsDate: true })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Note (Optional)</label>
              <textarea
                {...register('note')}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Add a note..."
              />
            </div>

            <button
              type="submit"
              disabled={createTransfer.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createTransfer.isPending ? 'Creating...' : 'Transfer'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
