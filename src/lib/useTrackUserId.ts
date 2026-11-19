import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/nextjs';
import { track } from '@/lib/analytics';
import { isTrackableSession } from '@/utils/session-identity';
import { logger } from '@/logger';
import { useStore } from '@/store';

// Matches Bumblebee's GA User-ID hash so both frontends map the same account
// to the same id.
const hashUsername = async (username: string): Promise<string> => {
  const buffer = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(username));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const useTrackUserId = () => {
  const user = useStore((state) => state.user);
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    // The store rehydrates a persisted `user` over SSR state even when expired.
    const username = isTrackableSession(user) ? user.username : null;

    if (!username) {
      if (lastSentRef.current !== null) {
        lastSentRef.current = null;
        track('user_update', { user_id: null });
        Sentry.setUser(null);
      }
      return;
    }

    let cancelled = false;
    hashUsername(username)
      .then((userId) => {
        // The 5-minute token refresh rewrites `user` with the same identity.
        if (cancelled || lastSentRef.current === userId) {
          return;
        }
        lastSentRef.current = userId;
        track('user_update', { user_id: userId });
        Sentry.setUser({ id: userId });
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        lastSentRef.current = null;
        track('user_update', { user_id: null });
        Sentry.setUser(null);
        logger.error({ err }, 'useTrackUserId: hash error');
      });

    return () => {
      cancelled = true;
    };
  }, [user]);
};
