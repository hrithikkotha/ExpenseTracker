/**
 * IndexedDB Database Schema using Dexie.js
 *
 * This database stores offline data for:
 * - Pending transactions (to be synced)
 * - Cached transactions (for offline viewing)
 * - Cached accounts (for offline viewing)
 * - Cached budgets (for offline viewing)
 * - Sync queue (operations pending upload)
 */

import Dexie, { Table } from 'dexie';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OfflineTransaction {
  id?: number; // Auto-incremented local ID
  serverId?: string; // Server ID (if synced)
  userId: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  purpose: string;
  note?: string;
  date: string; // ISO string
  toAccountId?: string; // For transfers
  createdAt: string; // ISO string
  syncStatus: 'pending' | 'synced' | 'error';
  syncError?: string;
  localOnly: boolean; // True if created offline
}

export interface OfflineAccount {
  id?: number;
  serverId: string;
  userId: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  currency: string;
  currentBalance: number;
  openingBalance: number;
  includeInNetWorth: boolean;
  isDefault: boolean;
  isArchived: boolean;
  notes?: string;
  lastSyncedAt: string; // ISO string
}

export interface OfflineBudget {
  id?: number;
  serverId: string;
  userId: string;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  spent: number;
  lastSyncedAt: string;
}

export interface SyncQueueItem {
  id?: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'transaction' | 'account' | 'budget';
  entityId?: string; // Local or server ID
  payload: any; // The data to sync
  endpoint: string; // API endpoint
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  timestamp: string; // ISO string
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

export interface AppMetadata {
  key: string;
  value: any;
  updatedAt: string;
}

// ============================================================================
// DATABASE CLASS
// ============================================================================

class ExpenseTrackerDB extends Dexie {
  // Tables
  transactions!: Table<OfflineTransaction, number>;
  accounts!: Table<OfflineAccount, number>;
  budgets!: Table<OfflineBudget, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  metadata!: Table<AppMetadata, string>;

  constructor() {
    super('ExpenseTrackerDB');

    // Define schema
    this.version(1).stores({
      transactions: '++id, serverId, userId, accountId, type, date, syncStatus, localOnly',
      accounts: '++id, serverId, userId, name, isDefault, isArchived',
      budgets: '++id, serverId, userId, name, period',
      syncQueue: '++id, status, entity, operation, timestamp',
      metadata: 'key, updatedAt',
    });
  }
}

// Singleton instance
export const db = new ExpenseTrackerDB();

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Clear all offline data (useful for logout)
 */
export async function clearOfflineData(): Promise<void> {
  await Promise.all([
    db.transactions.clear(),
    db.accounts.clear(),
    db.budgets.clear(),
    db.syncQueue.clear(),
    db.metadata.clear(),
  ]);
}

/**
 * Get database size estimate (in MB)
 */
export async function getDatabaseSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usageInMB = (estimate.usage || 0) / (1024 * 1024);
    return Math.round(usageInMB * 100) / 100; // Round to 2 decimals
  }
  return 0;
}

/**
 * Check if storage quota is available
 */
export async function checkStorageQuota(): Promise<{
  available: boolean;
  usage: number;
  quota: number;
  percent: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percent = quota > 0 ? Math.round((usage / quota) * 100) : 0;

    return {
      available: percent < 90, // Consider unavailable if > 90%
      usage: Math.round(usage / (1024 * 1024)), // MB
      quota: Math.round(quota / (1024 * 1024)), // MB
      percent,
    };
  }

  return {
    available: true,
    usage: 0,
    quota: 0,
    percent: 0,
  };
}

/**
 * Get metadata value
 */
export async function getMetadata(key: string): Promise<any> {
  const item = await db.metadata.get(key);
  return item?.value;
}

/**
 * Set metadata value
 */
export async function setMetadata(key: string, value: any): Promise<void> {
  await db.metadata.put({
    key,
    value,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Export database for debugging
 */
export async function exportDatabase(): Promise<any> {
  return {
    transactions: await db.transactions.toArray(),
    accounts: await db.accounts.toArray(),
    budgets: await db.budgets.toArray(),
    syncQueue: await db.syncQueue.toArray(),
    metadata: await db.metadata.toArray(),
  };
}
