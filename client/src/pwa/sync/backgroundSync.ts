/**
 * Background Sync Service
 *
 * Handles automatic synchronization of offline data when connectivity is restored.
 * Uses intelligent retry logic and batch processing.
 */

import axios from 'axios';
import {
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  clearSyncedItems,
  getPendingCount,
} from './syncQueue';
import { updateTransactionSyncStatus } from '../offline/offlineStorage';
import { getAccessToken } from '@/lib/tokenStore';

// ============================================================================
// TYPES
// ============================================================================

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export type SyncCallback = (result: SyncResult) => void;

// ============================================================================
// SYNC STATE
// ============================================================================

let isSyncing = false;
let syncCallbacks: SyncCallback[] = [];

/**
 * Register a callback to be notified when sync completes
 */
export function onSyncComplete(callback: SyncCallback): () => void {
  syncCallbacks.push(callback);

  // Return unsubscribe function
  return () => {
    syncCallbacks = syncCallbacks.filter((cb) => cb !== callback);
  };
}

/**
 * Notify all registered callbacks
 */
function notifyCallbacks(result: SyncResult): void {
  syncCallbacks.forEach((callback) => {
    try {
      callback(result);
    } catch (error) {
      console.error('Error in sync callback:', error);
    }
  });
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Process a single sync item
 */
async function processSyncItem(item: any): Promise<boolean> {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Update status to syncing
    if (item.id) {
      await updateSyncItemStatus(item.id, 'syncing');
    }

    // Make API request
    const response = await axios({
      method: item.method,
      url: item.endpoint,
      data: item.payload,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Update status to synced
    if (item.id) {
      await updateSyncItemStatus(item.id, 'synced');

      // If it's a transaction, update the offline transaction
      if (item.entity === 'transaction' && item.entityId) {
        const serverId = response.data?._id || response.data?.data?._id;
        await updateTransactionSyncStatus(parseInt(item.entityId), 'synced', serverId);
      }

      // Remove from queue after successful sync
      await removeSyncItem(item.id);
    }

    return true;
  } catch (error: any) {
    console.error('Failed to sync item:', error);

    // Update status to failed
    if (item.id) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Unknown sync error';
      await updateSyncItemStatus(item.id, 'failed', errorMessage);
    }

    return false;
  }
}

/**
 * Sync all pending items
 */
export async function syncPendingData(): Promise<SyncResult> {
  if (isSyncing) {
    console.log('Sync already in progress, skipping...');
    return {
      success: false,
      syncedCount: 0,
      failedCount: 0,
      errors: ['Sync already in progress'],
    };
  }

  isSyncing = true;

  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // Check connectivity
    if (!navigator.onLine) {
      result.success = false;
      result.errors.push('No internet connection');
      return result;
    }

    // Get pending items
    const pendingItems = await getPendingSyncItems();

    if (pendingItems.length === 0) {
      console.log('No pending items to sync');
      return result;
    }

    console.log(`Starting sync of ${pendingItems.length} items...`);

    // Process items sequentially to avoid race conditions
    for (const item of pendingItems) {
      const success = await processSyncItem(item);

      if (success) {
        result.syncedCount++;
      } else {
        result.failedCount++;
        result.errors.push(`Failed to sync ${item.entity} ${item.operation}`);
      }

      // Small delay between requests to avoid overwhelming server
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clean up synced items
    await clearSyncedItems();

    result.success = result.failedCount === 0;

    console.log(
      `Sync completed: ${result.syncedCount} success, ${result.failedCount} failed`,
    );
  } catch (error: any) {
    console.error('Sync process error:', error);
    result.success = false;
    result.errors.push(error.message || 'Unknown error during sync');
  } finally {
    isSyncing = false;

    // Notify callbacks
    notifyCallbacks(result);
  }

  return result;
}

/**
 * Check if sync is currently in progress
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

/**
 * Get pending sync count
 */
export async function getPendingSyncCount(): Promise<number> {
  return await getPendingCount();
}

// ============================================================================
// AUTO SYNC
// ============================================================================

let autoSyncEnabled = true;
let autoSyncInterval: NodeJS.Timeout | null = null;

/**
 * Enable automatic sync when online
 */
export function enableAutoSync(): void {
  autoSyncEnabled = true;

  // Listen for online event
  window.addEventListener('online', handleOnline);

  // Periodic sync every 2 minutes (if pending items exist)
  if (!autoSyncInterval) {
    autoSyncInterval = setInterval(async () => {
      if (navigator.onLine && !isSyncing) {
        const count = await getPendingSyncCount();
        if (count > 0) {
          console.log('Auto-syncing pending items...');
          await syncPendingData();
        }
      }
    }, 120000); // 2 minutes
  }
}

/**
 * Disable automatic sync
 */
export function disableAutoSync(): void {
  autoSyncEnabled = false;
  window.removeEventListener('online', handleOnline);

  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

/**
 * Handle online event
 */
async function handleOnline(): Promise<void> {
  if (autoSyncEnabled && !isSyncing) {
    console.log('Connection restored, syncing pending data...');

    // Wait a bit to ensure connection is stable
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const count = await getPendingSyncCount();
    if (count > 0) {
      await syncPendingData();
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize background sync
 */
export function initializeBackgroundSync(): void {
  enableAutoSync();

  // If online on initialization, sync immediately
  if (navigator.onLine) {
    getPendingSyncCount().then((count) => {
      if (count > 0) {
        console.log(`Found ${count} pending items on startup, syncing...`);
        syncPendingData();
      }
    });
  }
}
