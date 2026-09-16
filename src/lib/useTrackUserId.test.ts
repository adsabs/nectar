import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useTrackUserId } from './useTrackUserId';

const sendGTMEvent = vi.fn();
vi.mock('@next/third-parties/google', () => ({
  sendGTMEvent: (...args: unknown[]) => sendGTMEvent(...args),
}));

type User = { username: string; anonymous: boolean; access_token: string; expires_at: string } | undefined;
let user: User;
vi.mock('@/store', () => ({
  useStore: (selector: (state: { user: User }) => unknown) => selector({ user }),
}));

const authed = (username: string): User => ({
  username,
  anonymous: false,
  access_token: 'token',
  expires_at: '9999999999',
});

const HASH = 'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514'; // sha256('user@example.com')

beforeEach(() => {
  user = undefined;
});

afterEach(() => {
  sendGTMEvent.mockReset();
});

describe('useTrackUserId', () => {
  test('sends the hashed username when a session is authenticated', async () => {
    user = authed('user@example.com');
    renderHook(() => useTrackUserId());

    await waitFor(() => expect(sendGTMEvent).toHaveBeenCalledWith({ event: 'user_update', user_id: HASH }));
  });

  test('sends nothing for an anonymous session', async () => {
    user = { ...authed('anonymous@ads'), anonymous: true };
    renderHook(() => useTrackUserId());

    await waitFor(() => expect(sendGTMEvent).not.toHaveBeenCalled());
  });

  test('sends nothing for a non-anonymous session whose token has expired', async () => {
    user = { ...authed('user@example.com'), expires_at: String(Math.floor(Date.now() / 1000) - 60) };
    renderHook(() => useTrackUserId());

    await waitFor(() => expect(sendGTMEvent).not.toHaveBeenCalled());
  });

  test('sends nothing when expires_at is not a usable timestamp', async () => {
    user = { ...authed('user@example.com'), expires_at: 'not-a-timestamp' };
    renderHook(() => useTrackUserId());

    await waitFor(() => expect(sendGTMEvent).not.toHaveBeenCalled());
  });

  test('clears the tracked id when hashing fails, so a later attempt retries', async () => {
    user = authed('user@example.com');
    const { rerender } = renderHook(() => useTrackUserId());
    await waitFor(() => expect(sendGTMEvent).toHaveBeenCalledTimes(1));

    const digest = vi.spyOn(globalThis.crypto.subtle, 'digest').mockRejectedValue(new Error('no subtle'));
    user = { ...authed('user@example.com'), access_token: 'refreshed' };
    rerender();
    await waitFor(() => expect(digest).toHaveBeenCalled());
    digest.mockRestore();

    user = { ...authed('user@example.com'), access_token: 'again' };
    rerender();

    await waitFor(() => expect(sendGTMEvent).toHaveBeenCalledTimes(2));
  });

  test('does not re-send when the same user object is replaced by a token refresh', async () => {
    user = authed('user@example.com');
    const { rerender } = renderHook(() => useTrackUserId());
    await waitFor(() => expect(sendGTMEvent).toHaveBeenCalledTimes(1));

    user = { ...authed('user@example.com'), access_token: 'refreshed' };
    rerender();

    await waitFor(() => expect(sendGTMEvent).toHaveBeenCalledTimes(1));
  });

  test('clears the id on logout', async () => {
    user = authed('user@example.com');
    const { rerender } = renderHook(() => useTrackUserId());
    await waitFor(() => expect(sendGTMEvent).toHaveBeenCalledTimes(1));

    user = undefined;
    rerender();

    await waitFor(() => expect(sendGTMEvent).toHaveBeenLastCalledWith({ event: 'user_update', user_id: null }));
  });
});
