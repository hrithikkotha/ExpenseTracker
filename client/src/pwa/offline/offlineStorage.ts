/**
 * Offline Storage Service
 *
 * Manages local storage of transactions, accounts, and budgets for offline access.
 * Handles caching server data and retrieving offline data.
 */

import { db, OfflineTransaction, OfflineAccount, OfflineBudget } from '../db';

// ============================================================================
// TRANSACTION STORAGE
// ============================================================================

/**
 * Save a transaction to offline storage
 */
export async function saveTransactionOffline(
  transaction: Omit<OfflineTransaction, 'id'>,
): Promise<number> {
  return await db.transactions.add(transaction);
}

/**
 * Get all offline transactions for a user
 */
export async function getOfflineTransactions(userId: string): Promise<OfflineTransaction[]> {
  return await db.transactions.where('userId').equals(userId).toArray();
}

/**
 * Get pending (unsynced) transactions
 */
export async function getPendingTransactions(userId: string): Promise<OfflineTransaction[]> {
  return await db.transactions
    .where('[userId+syncStatus]')
    .equals([userId, 'pending'])
    .toArray();
}

/**
 * Get synced transactions (for offline viewing)
 */
export async function getSyncedTransactions(userId: string): Promise<OfflineTransaction[]> {
  return await db.transactions
    .where('[userId+syncStatus]')
    .equals([userId, 'synced'])
    .toArray();
}

/**
 * Update transaction sync status
 */
export async function updateTransactionSyncStatus(
  localId: number,
  status: 'pending' | 'synced' | 'error',
  serverId?: string,
  error?: string,
): Promise<void> {
  await db.transactions.update(localId, {
    syncStatus: status,
    serverId,
    syncError: error,
  });
}

/**
 * Delete transaction from offline storage
 */
export async function deleteOfflineTransaction(localId: number): Promise<void> {
  await db.transactions.delete(localId);
}

/**
 * Cache server transactions for offline viewing
 */
export async function cacheServerTransactions(
  userId: string,
  transactions: any[],
): Promise<void> {
  // Convert server transactions to offline format
  const offlineTransactions: OfflineTransaction[] = transactions.map((t) => ({
    serverId: t._id,
    userId,
    accountId: t.account,
    type: t.type,
    amount: t.amount,
    purpose: t.purpose,
    note: t.note,
    date: t.date,
    toAccountId: t.toAccount,
    createdAt: t.createdAt,
    syncStatus: 'synced',
    localOnly: false,
  }));

  // Clear old synced transactions and add new ones
  await db.transactions.where('[userId+syncStatus]').equals([userId, 'synced']).delete();
  await db.transactions.bulkAdd(offlineTransactions);
}

// ============================================================================
// ACCOUNT STORAGE
// ============================================================================

/**
 * Save account to offline storage
 */
export async function saveAccountOffline(account: Omit<OfflineAccount, 'id'>): Promise<number> {
  return await db.accounts.add(account);
}

/**
 * Get all offline accounts for a user
 */
export async function getOfflineAccounts(userId: string): Promise<OfflineAccount[]> {
  return await db.accounts.where('userId').equals(userId).toArray();
}

/**
 * Update account in offline storage
 */
export async function updateOfflineAccount(
  serverId: string,
  updates: Partial<OfflineAccount>,
): Promise<void> {
  const account = await db.accounts.where('serverId').equals(serverId).first();
  if (account && account.id) {
    await db.accounts.update(account.id, updates);
  }
}

/**
 * Cache server accounts for offline viewing
 */
export async function cacheServerAccounts(userId: string, accounts: any[]): Promise<void> {
  const offlineAccounts: OfflineAccount[] = accounts.map((a) => ({
    serverId: a._id,
    userId,
    name: a.name,
    type: a.type,
    icon: a.icon,
    color: a.color,
    currency: a.currency,
    currentBalance: a.currentBalance,
    openingBalance: a.openingBalance,
    includeInNetWorth: a.includeInNetWorth,
    isDefault: a.isDefault,
    isArchived: a.isArchived,
    notes: a.notes,
    lastSyncedAt: new Date().toISOString(),
  }));

  // Clear old and add new
  await db.accounts.where('userId').equals(userId).delete();
  await db.accounts.bulkAdd(offlineAccounts);
}

// ============================================================================
// BUDGET STORAGE
// ============================================================================

/**
 * Save budget to offline storage
 */
export async function saveBudgetOffline(budget: Omit<OfflineBudget, 'id'>): Promise<number> {
  return await db.budgets.add(budget);
}

/**
 * Get all offline budgets for a user
 */
export async function getOfflineBudgets(userId: string): Promise<OfflineBudget[]> {
  return await db.budgets.where('userId').equals(userId).toArray();
}

/**
 * Cache server budgets for offline viewing
 */
export async function cacheServerBudgets(userId: string, budgets: any[]): Promise<void> {
  const offlineBudgets: OfflineBudget[] = budgets.map((b) => ({
    serverId: b._id,
    userId,
    name: b.name,
    amount: b.amount,
    period: b.period,
    startDate: b.startDate,
    endDate: b.endDate,
    spent: b.spent,
    lastSyncedAt: new Date().toISOString(),
  }));

  // Clear old and add new
  await db.budgets.where('userId').equals(userId).delete();
  await db.budgets.bulkAdd(offlineBudgets);
}

// ============================================================================
// COMBINED OPERATIONS
// ============================================================================

/**
 * Get all data for offline mode
 */
export async function getAllOfflineData(userId: string): Promise<{
  transactions: OfflineTransaction[];
  accounts: OfflineAccount[];
  budgets: OfflineBudget[];
}> {
  const [transactions, accounts, budgets] = await Promise.all([
    getOfflineTransactions(userId),
    getOfflineAccounts(userId),
    getOfflineBudgets(userId),
  ]);

  return { transactions, accounts, budgets };
}

/**
 * Count pending items
 */
export async function countPendingItems(userId: string): Promise<number> {
  const pendingTransactions = await getPendingTransactions(userId);
  return pendingTransactions.length;
}
