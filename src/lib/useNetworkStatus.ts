import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
}

/**
 * Hook to track network connectivity status.
 * Returns current online status and whether the user was recently offline.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') {
      return true;
    }
    return navigator.onLine;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
    if (!isOnline) {
      setWasOffline(true);
    }
  }, [isOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    lastOnlineAt,
  };
}

/**
 * Hook to clear the "was offline" flag after a reconnection.
 * Useful for dismissing reconnection notifications.
 */
export function useResetWasOffline(): () => void {
  const [, setResetFlag] = useState(0);

  const reset = useCallback(() => {
    setResetFlag((prev) => prev + 1);
  }, []);

  return reset;
}
