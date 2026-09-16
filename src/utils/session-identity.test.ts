import { describe, expect, test } from 'vitest';
import { isTrackableSession } from './session-identity';
import { IUserData } from '@/api/user/types';

const FUTURE = String(Math.floor(Date.now() / 1000) + 3600);

const user = (overrides: Partial<IUserData> = {}): IUserData => ({
  username: 'user@example.com',
  anonymous: false,
  access_token: 'token',
  expires_at: FUTURE,
  ...overrides,
});

describe('isTrackableSession', () => {
  test('accepts a live authenticated session', () => {
    expect(isTrackableSession(user())).toBe(true);
  });

  test.each([
    ['no user', undefined],
    ['anonymous', user({ anonymous: true })],
    ['empty username', user({ username: '' })],
    ['empty access token', user({ access_token: '' })],
    ['expired', user({ expires_at: String(Math.floor(Date.now() / 1000) - 60) })],
    ['unparseable expiry', user({ expires_at: 'not-a-timestamp' })],
    ['empty expiry', user({ expires_at: '' })],
  ])('rejects %s', (_label, candidate) => {
    expect(isTrackableSession(candidate)).toBe(false);
  });
});
