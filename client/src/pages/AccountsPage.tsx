import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { useAccounts, useSyncBalances } from '@/features/accounts/hooks';
import { AccountCard } from '@/features/accounts/components/AccountCard';
import { AccountFormModal } from '@/features/accounts/components/AccountFormModal';
import type { Account } from '@/features/accounts/types';

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const syncBalances = useSyncBalances();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(undefined);
  };

  const handleSync = () => {
    syncBalances.mutate();
  };

  return (
    <AppLayout
      title="Accounts"
      actions={
        <>
          <button
            onClick={handleSync}
            disabled={syncBalances.isPending}
            className="touch-target rounded-full hover:bg-muted transition-colors p-2"
            aria-label="Sync balances"
          >
            <RefreshCw className={`w-5 h-5 ${syncBalances.isPending ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setSelectedAccount(undefined);
              setIsModalOpen(true);
            }}
            className="touch-target rounded-full hover:bg-muted transition-colors p-2"
            aria-label="Add account"
          >
            <Plus className="w-5 h-5" />
          </button>
        </>
      }
    >
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-40 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account._id}
                account={account}
                onClick={() => handleAccountClick(account)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No accounts yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Account
            </button>
          </div>
        )}
      </div>

      <AccountFormModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        account={selectedAccount}
      />
    </AppLayout>
  );
}
