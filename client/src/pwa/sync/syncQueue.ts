/**
 * Sync Queue Service
 *
 * Manages the queue of operations that need to be synchronized with the server.
 * Handles retries, error tracking, and batch processing.
 */

import { db, SyncQueueItem } from '../db';

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

/**
 * Add an operation to the sync queue
 */
export async function addToSyncQueue(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: 'transaction' | 'account' | 'budget',
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload: any,
  entityId?: string,
): Promise<number> {
  const item: Omit<SyncQueueItem, 'id'> = {
    operation,
    entity,
    entityId,
    payload,
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };

  return await db.syncQueue.add(item);
}

/**
 * Get all pending items in the sync queue
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return await db.syncQueue.where('status').equals('pending').sortBy('timestamp');
}

/**
 * Get all sync queue items (for debugging)
 */
export async function getAllSyncItems(): Promise<SyncQueueItem[]> {
  return await db.syncQueue.toArray();
}

/**
 * Update sync queue item status
 */
export async function updateSyncItemStatus(
  itemId: number,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  error?: string,
): Promise<void> {
  const updates: Partial<SyncQueueItem> = { status };

  if (error) {
    updates.lastError = error;
    updates.retryCount = ((await db.syncQueue.get(itemId))?.retryCount || 0) + 1;
  }

  await db.syncQueue.update(itemId, updates);
}

/**
 * Remove item from sync queue
 */
export async function removeSyncItem(itemId: number): Promise<void> {
  await db.syncQueue.delete(itemId);
}

/**
 * Clear all synced items from queue
 */
export async function clearSyncedItems(): Promise<void> {
  await db.syncQueue.where('status').equals('synced').delete();
}

/**
 * Clear all items from queue (use with caution!)
 */
export async function clearAllSyncItems(): Promise<void> {
  await db.syncQueue.clear();
}

/**
 * Get count of pending items
 */
export async function getPendingCount(): Promise<number> {
  return await db.syncQueue.where('status').equals('pending').count();
}

/**
 * Get count of failed items
 */
export async function getFailedCount(): Promise<number> {
  return await db.syncQueue.where('status').equals('failed').count();
}

/**
 * Retry failed items
 */
export async function retryFailedItems(): Promise<void> {
  const failedItems = await db.syncQueue.where('status').equals('failed').toArray();

  for (const item of failedItems) {
    if (item.id && item.retryCount < 3) {
      // Max 3 retries
      await db.syncQueue.update(item.id, {
        status: 'pending',
        lastError: undefined,
      });
    }
  }
}

/**
 * Get sync queue statistics
 */
export async function getSyncQueueStats(): Promise<{
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  total: number;
}> {
  const items = await db.syncQueue.toArray();

  return {
    pending: items.filter((i) => i.status === 'pending').length,
    syncing: items.filter((i) => i.status === 'syncing').length,
    synced: items.filter((i) => i.status === 'synced').length,
    failed: items.filter((i) => i.status === 'failed').length,
    total: items.length,
  };
}

// ============================================================================
// QUEUE PROCESSING HELPERS
// ============================================================================

/**
 * Check if there are pending items to sync
 */
export async function hasPendingSync(): Promise<boolean> {
  const count = await getPendingCount();
  return count > 0;
}

/**
 * Check if an entity has pending operations
 */
export async function hasPendingOperationsForEntity(
  entity: 'transaction' | 'account' | 'budget',
  entityId: string,
): Promise<boolean> {
  const items = await db.syncQueue
    .where('[entity+entityId+status]')
    .equals([entity, entityId, 'pending'])
    .count();

  return items > 0;
}

/**
 * Cancel pending operations for an entity
 */
export async function cancelPendingOperationsForEntity(
  entity: 'transaction' | 'account' | 'budget',
  entityId: string,
): Promise<void> {
  const items = await db.syncQueue
    .where('[entity+entityId+status]')
    .equals([entity, entityId, 'pending'])
    .toArray();

  for (const item of items) {
    if (item.id) {
      await db.syncQueue.delete(item.id);
    }
  }
}
