/**
 * Sync Status Hook
 *
 * React hook for tracking synchronization status with the server.
 * Provides real-time info about pending syncs, sync progress, and errors.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getPendingSyncCount,
  isSyncInProgress,
  syncPendingData,
  onSyncComplete,
  SyncResult,
} from '../sync/backgroundSync';
import { getSyncQueueStats } from '../sync/syncQueue';

export interface SyncStatus {
  isPending: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncResult: SyncResult | null;
  sync: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to track sync status
 */
export function useSyncStatus(): SyncStatus {
  const [isPending, setIsPending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Refresh sync status
  const refresh = useCallback(async () => {
    const count = await getPendingSyncCount();
    const syncing = isSyncInProgress();

    setPendingCount(count);
    setIsPending(count > 0);
    setIsSyncing(syncing);
  }, []);

  // Manual sync trigger
  const sync = useCallback(async () => {
    if (isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    setIsSyncing(true);
    const result = await syncPendingData();
    setLastSyncResult(result);
    setIsSyncing(false);

    // Refresh after sync
    await refresh();
  }, [isSyncing, refresh]);

  // Listen for sync completion
  useEffect(() => {
    const unsubscribe = onSyncComplete((result) => {
      setLastSyncResult(result);
      setIsSyncing(false);
      refresh();
    });

    return unsubscribe;
  }, [refresh]);

  // Initial load and periodic refresh
  useEffect(() => {
    refresh();

    // Refresh every 10 seconds
    const interval = setInterval(refresh, 10000);

    return () => clearInterval(interval);
  }, [refresh]);

  return {
    isPending,
    isSyncing,
    pendingCount,
    lastSyncResult,
    sync,
    refresh,
  };
}

/**
 * Hook for detailed sync queue statistics
 */
export function useSyncQueueStats() {
  const [stats, setStats] = useState({
    pending: 0,
    syncing: 0,
    synced: 0,
    failed: 0,
    total: 0,
  });

  const refresh = useCallback(async () => {
    const queueStats = await getSyncQueueStats();
    setStats(queueStats);
  }, []);

  useEffect(() => {
    refresh();

    // Refresh every 5 seconds
    const interval = setInterval(refresh, 5000);

    return () => clearInterval(interval);
  }, [refresh]);

  return { stats, refresh };
}
