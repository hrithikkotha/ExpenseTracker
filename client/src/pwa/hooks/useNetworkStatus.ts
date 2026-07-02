/**
 * Network Status Hook
 *
 * React hook for monitoring network connectivity status.
 * Provides real-time online/offline state.
 */

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
}

/**
 * Hook to track network status
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({});

  useEffect(() => {
    // Update connection info if Network Information API is available
    const updateConnectionInfo = () => {
      const nav = navigator as any;
      if (nav.connection || nav.mozConnection || nav.webkitConnection) {
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

        setConnectionInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      }
    };

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      updateConnectionInfo();
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    // Initial connection info
    updateConnectionInfo();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    ...connectionInfo,
  };
}

/**
 * Hook to detect slow connection
 */
export function useSlowConnection(): boolean {
  const { effectiveType } = useNetworkStatus();
  return effectiveType === 'slow-2g' || effectiveType === '2g';
}
