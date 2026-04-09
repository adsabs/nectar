import { StateStorage } from 'zustand/middleware';
import { logger } from '@/logger';

const STORAGE_PROBE_KEY = '__scix_storage_probe__';

/**
 * Returns false if cookies are blocked at the browser level.
 * Checks navigator.cookieEnabled first, then probes document.cookie
 * to catch SecurityError thrown by strict privacy policies (e.g. Firefox ETP).
 * Always returns true during SSR.
 */
export function isCookiesAvailable(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  if (!navigator.cookieEnabled) {
    return false;
  }
  try {
    void document.cookie;
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns false if localStorage is blocked at the browser level.
 * Probes via setItem/removeItem to catch SecurityError.
 * Always returns true during SSR.
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, '1');
    localStorage.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns a Zustand StateStorage adapter that wraps localStorage in try/catch.
 * On error: logs at debug level and returns null / no-ops.
 * Zustand handles JSON serialization; this is a string-based storage adapter.
 *
 * Usage in persist config: `getStorage: createSafeStorage`
 */
export function createSafeStorage(): StateStorage {
  if (typeof window === 'undefined') {
    // SSR: return a no-op adapter so the store can be created without logging
    // or incurring try/catch overhead on every server-side request.
    return { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };
  }
  return {
    getItem(name: string): string | null {
      try {
        return localStorage.getItem(name);
      } catch {
        logger.debug({ name }, 'browserStorage: getItem failed');
        return null;
      }
    },
    setItem(name: string, value: string): void {
      try {
        localStorage.setItem(name, value);
      } catch {
        logger.debug({ name }, 'browserStorage: setItem failed');
      }
    },
    removeItem(name: string): void {
      try {
        localStorage.removeItem(name);
      } catch {
        logger.debug({ name }, 'browserStorage: removeItem failed');
      }
    },
  };
}

export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function safeSessionStorageGet(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSessionStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function safeSessionStorageRemove(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
