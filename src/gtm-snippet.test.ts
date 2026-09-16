import { describe, expect, test } from 'vitest';
import { getGtmSnippet, getGtmUserId } from './gtm-snippet';
import { IUserData } from '@/api/user/types';

const FUTURE = String(Math.floor(Date.now() / 1000) + 3600);
const PAST = String(Math.floor(Date.now() / 1000) - 3600);

const user = (overrides: Partial<IUserData> = {}): IUserData => ({
  username: 'user@example.com',
  anonymous: false,
  access_token: 'token',
  expires_at: FUTURE,
  ...overrides,
});

// SHA-256 of 'user@example.com' — must match useTrackUserId and Bumblebee.
const HASH = 'b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514';

describe('getGtmUserId', () => {
  test('hashes the username of a live authenticated session', () => {
    expect(getGtmUserId(user())).toBe(HASH);
  });

  test('returns null for an anonymous session', () => {
    expect(getGtmUserId(user({ username: 'anonymous@ads', anonymous: true }))).toBeNull();
  });

  test('returns null once the token has expired', () => {
    expect(getGtmUserId(user({ expires_at: PAST }))).toBeNull();
  });

  test('returns null when there is no user', () => {
    expect(getGtmUserId(undefined)).toBeNull();
    expect(getGtmUserId({} as IUserData)).toBeNull();
  });
});

describe('getGtmSnippet', () => {
  test('seeds user_id ahead of the gtm.js push', () => {
    const snippet = getGtmSnippet('GTM-TEST', HASH);
    expect(snippet).toContain(`"${HASH}"`);
    expect(snippet.indexOf('user_id:u')).toBeLessThan(snippet.indexOf('gtm.start'));
  });

  test('passes null when there is no id, so nothing is seeded', () => {
    const snippet = getGtmSnippet('GTM-TEST');
    expect(snippet).toContain(',null)');
    expect(snippet).toContain('if(u)');
  });

  test('escapes the container id rather than interpolating it raw', () => {
    expect(getGtmSnippet('GTM-TEST')).toContain('"GTM-TEST"');
  });
});
