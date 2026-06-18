import { useEffect, useState } from 'react';
import { getSessionItem, SessionStorageKey } from './sessionStore';

export interface SessionValueState<T> {
  /** The stored value, or null on the server, before the mount read, or on a miss. */
  value: T | null;
  /** False until the client mount read has completed; lets callers tell "not read yet" from "empty". */
  isReady: boolean;
}

/**
 * SSR-safe read of a sessionStorage value.
 *
 * Returns `{ value: null, isReady: false }` on the server and on the first
 * client render so the markup matches, then reads the stored value in a mount
 * effect and flips `isReady` to true. The atomic update means consumers never
 * observe a "ready but stale" intermediate state.
 *
 * The value is read on mount (and when `key` changes); it does not subscribe to
 * later same-tab writes.
 */
export const useSessionValue = <T>(key: SessionStorageKey): SessionValueState<T> => {
  const [state, setState] = useState<SessionValueState<T>>({ value: null, isReady: false });

  // Read after mount so server and first client render agree (null, not ready).
  useEffect(() => {
    setState({ value: getSessionItem<T>(key), isReady: true });
  }, [key]);

  return state;
};
