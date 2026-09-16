import { useEffect, useRef } from 'react';
import { sendGTMEvent } from '@next/third-parties/google';
import { isValidToken } from '@/auth-utils';
import { logger } from '@/logger';
import { useStore } from '@/store';

// SHA-256 hex digest, matching Bumblebee's GA User-ID hash for the same account.
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
    // Persisted `user` rehydrates over SSR state even when expired, so gate
    // on token validity, not just shape.
    const username = isValidToken(user) && !user.anonymous ? user.username : null;

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
        // Dedup: the 5-minute token refresh rewrites `user` without changing identity.
        if (cancelled || lastSentRef.current === userId) {
          return;
        }
        lastSentRef.current = userId;
        sendGTMEvent({ event: 'user_update', user_id: userId });
      })
      .catch((err: unknown) => {
        logger.error({ err }, 'useTrackUserId: hash error');
      });

    return () => {
      cancelled = true;
    };
  }, [user]);
};
