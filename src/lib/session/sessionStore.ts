import { logger } from '@/logger';

/**
 * Per-tab session storage keys. Every sessionStorage key in the app should be
 * declared here so values share one SSR-safe access layer.
 */
export enum SessionStorageKey {
  SearchReturnUrl = 'search-return-url',
}

const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Read a JSON-serialized value from sessionStorage.
 * Returns null on the server, on a miss, or when parsing/access fails.
 */
export const getSessionItem = <T>(key: SessionStorageKey): T | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch (err) {
    logger.error({ err, key }, 'Failed to read sessionStorage');
    return null;
  }
};

/**
 * Write a JSON-serialized value to sessionStorage.
 * No-op on the server; swallows quota/private-mode failures.
 */
export const setSessionItem = <T>(key: SessionStorageKey, value: T): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    logger.error({ err, key }, 'Failed to write sessionStorage');
  }
};

/**
 * Remove a value from sessionStorage. No-op on the server.
 */
export const removeSessionItem = (key: SessionStorageKey): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
  } catch (err) {
    logger.error({ err, key }, 'Failed to remove sessionStorage');
  }
};
