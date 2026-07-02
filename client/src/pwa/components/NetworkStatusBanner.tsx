/**
 * Network Status Banner Component
 *
 * Displays a banner showing the current network status:
 * - Offline (red)
 * - Syncing (yellow)
 * - Pending changes (blue)
 * - Online (green, auto-hide after 3 seconds)
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CloudOff, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncStatus } from '../hooks/useSyncStatus';

export function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();
  const { isPending, isSyncing, pendingCount, sync } = useSyncStatus();
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  // Track when we come back online
  useEffect(() => {
    if (isOnline && !justCameOnline) {
      setJustCameOnline(true);
      setShowOnlineBanner(true);

      // Hide "Back online" message after 3 seconds
      const timer = setTimeout(() => {
        setShowOnlineBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    }

    if (!isOnline) {
      setJustCameOnline(false);
      setShowOnlineBanner(false);
    }
  }, [isOnline, justCameOnline]);

  // Don't show anything if online and no pending changes
  if (isOnline && !isPending && !isSyncing && !showOnlineBanner) {
    return null;
  }

  // Offline state
  if (!isOnline) {
    return (
      <div className="bg-red-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 shadow-md">
        <WifiOff className="w-4 h-4" />
        <span className="font-medium">You're offline</span>
        {isPending && (
          <span className="opacity-90">
            • {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending
          </span>
        )}
      </div>
    );
  }

  // Syncing state
  if (isSyncing) {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 shadow-md">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="font-medium">Syncing {pendingCount} items...</span>
      </div>
    );
  }

  // Pending changes (online but not synced yet)
  if (isPending) {
    return (
      <div className="bg-blue-500 text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <CloudOff className="w-4 h-4" />
          <span className="font-medium">
            {pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending sync
          </span>
        </div>
        <button
          onClick={sync}
          className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
        >
          Sync Now
        </button>
      </div>
    );
  }

  // Just came online
  if (showOnlineBanner) {
    return (
      <div className="bg-green-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2 shadow-md">
        <Wifi className="w-4 h-4" />
        <span className="font-medium">Back online</span>
      </div>
    );
  }

  return null;
}

/**
 * Compact network status indicator (for use in navbars/headers)
 */
export function NetworkStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const { isPending, isSyncing, pendingCount } = useSyncStatus();

  if (isOnline && !isPending && !isSyncing) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs">
        <WifiOff className="w-3 h-3" />
        <span className="font-medium">Offline</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span className="font-medium">Syncing</span>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
        <CloudOff className="w-3 h-3" />
        <span className="font-medium">{pendingCount} pending</span>
      </div>
    );
  }

  return null;
}

/**
 * Sync error banner (shows when sync fails)
 */
export function SyncErrorBanner() {
  const { lastSyncResult } = useSyncStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastSyncResult && !lastSyncResult.success && lastSyncResult.failedCount > 0) {
      setVisible(true);
    }
  }, [lastSyncResult]);

  if (!visible || !lastSyncResult) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-3 text-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Sync failed</p>
            <p className="text-red-700 dark:text-red-400 mt-1">
              {lastSyncResult.failedCount} {lastSyncResult.failedCount === 1 ? 'item' : 'items'}{' '}
              could not be synced. They will be retried automatically.
            </p>
            {lastSyncResult.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-red-600 dark:text-red-400 text-xs">
                {lastSyncResult.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
