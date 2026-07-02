/**
 * Offline Transactions Hook
 *
 * React hook for managing transactions in offline mode.
 * Handles creating, reading, and syncing transactions when offline.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import {
  saveTransactionOffline,
  getOfflineTransactions,
  getPendingTransactions,
  cacheServerTransactions,
} from '../offline/offlineStorage';
import { addToSyncQueue } from '../sync/syncQueue';
import { OfflineTransaction } from '../db';

export interface CreateOfflineTransactionPayload {
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  purpose: string;
  note?: string;
  date: string;
  toAccountId?: string;
}

/**
 * Hook for offline transaction management
 */
export function useOfflineTransactions() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<OfflineTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load transactions from IndexedDB
  const loadTransactions = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [allTransactions, pending] = await Promise.all([
        getOfflineTransactions(user._id),
        getPendingTransactions(user._id),
      ]);

      setTransactions(allTransactions);
      setPendingTransactions(pending);
    } catch (error) {
      console.error('Error loading offline transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new transaction offline
  const createOfflineTransaction = useCallback(
    async (payload: CreateOfflineTransactionPayload): Promise<number | null> => {
      if (!user) return null;

      try {
        // Create offline transaction
        const offlineTransaction: Omit<OfflineTransaction, 'id'> = {
          userId: user._id,
          accountId: payload.accountId,
          type: payload.type,
          amount: payload.amount,
          purpose: payload.purpose,
          note: payload.note,
          date: payload.date,
          toAccountId: payload.toAccountId,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
          localOnly: true,
        };

        const localId = await saveTransactionOffline(offlineTransaction);

        // Add to sync queue
        await addToSyncQueue(
          'CREATE',
          'transaction',
          '/api/v1/transactions',
          'POST',
          payload,
          localId.toString(),
        );

        // Reload transactions
        await loadTransactions();

        return localId;
      } catch (error) {
        console.error('Error creating offline transaction:', error);
        return null;
      }
    },
    [user, loadTransactions],
  );

  // Cache server transactions for offline viewing
  const cacheTransactions = useCallback(
    async (serverTransactions: any[]) => {
      if (!user) return;

      try {
        await cacheServerTransactions(user._id, serverTransactions);
        await loadTransactions();
      } catch (error) {
        console.error('Error caching transactions:', error);
      }
    },
    [user, loadTransactions],
  );

  // Initial load
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    pendingTransactions,
    isLoading,
    isOfflineMode: !isOnline,
    createOfflineTransaction,
    cacheTransactions,
    refreshTransactions: loadTransactions,
  };
}
