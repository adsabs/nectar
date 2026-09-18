import { useEffect, useRef } from 'react';
import { sendGTMEvent } from '@next/third-parties/google';
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

/** Sends the logged-in user's hashed id to GA; sends null on logout. */
export const useTrackUserId = () => {
  const user = useStore((state) => state.user);
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    // The store rehydrates a persisted `user` over SSR state even when expired.
    const username = isTrackableSession(user) ? user.username : null;

    if (!username) {
      if (lastSentRef.current !== null) {
        lastSentRef.current = null;
        sendGTMEvent({ event: 'user_update', user_id: null });
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
        sendGTMEvent({ event: 'user_update', user_id: userId });
      })
      .catch((err: unknown) => {
        // Reset, or GA keeps attributing hits to whoever was last hashed.
        lastSentRef.current = null;
        logger.error({ err }, 'useTrackUserId: hash error');
      });

    return () => {
      cancelled = true;
    };
  }, [user]);
};
