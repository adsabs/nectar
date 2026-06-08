import { describe, expect, test } from 'vitest';

import { OrcidKeys, orcidKeys } from '@/api/orcid/orcid';

describe('orcidKeys', () => {
  test('exchangeToken omits user from the query key params', () => {
    const params = {
      user: {
        orcid: '0000-0000-0000-0001',
        access_token: 'secret-token',
      },
      code: 'auth-code',
      state: 'some-state',
    };

    expect(orcidKeys.exchangeToken(params)).toEqual([
      OrcidKeys.EXCHANGE_TOKEN,
      { code: 'auth-code', state: 'some-state' },
    ]);
  });

  test('profile preserves formatting flags while omitting user', () => {
    const params = {
      user: {
        orcid: '0000-0000-0000-0001',
        access_token: 'secret-token',
      },
      full: false,
      update: true,
    };

    expect(orcidKeys.profile(params)).toEqual([OrcidKeys.PROFILE, { full: false, update: true }]);
  });

  test('name and getWork keys keep non-user identifiers only', () => {
    const user = {
      orcid: '0000-0000-0000-0001',
      access_token: 'secret-token',
    };

    expect(orcidKeys.name({ user })).toEqual([OrcidKeys.NAME, {}]);
    expect(orcidKeys.getWork({ user, putcode: 12345 })).toEqual([OrcidKeys.GET_WORK, { putcode: 12345 }]);
  });

  test('preference keys follow the expected query and mutation shapes', () => {
    const params = {
      user: {
        orcid: '0000-0000-0000-0001',
        access_token: 'secret-token',
      },
    };

    expect(orcidKeys.getPreferences(params)).toEqual([OrcidKeys.GET_PREFERENCES, {}]);
    expect(orcidKeys.setPreferences()).toEqual([OrcidKeys.SET_PREFERENCES]);
  });

  test('addWorks and removeWorks return stable mutation keys', () => {
    expect(orcidKeys.addWorks()).toEqual([OrcidKeys.ADD_WORKS]);
    expect(orcidKeys.removeWorks()).toEqual([OrcidKeys.REMOVE_WORKS]);
  });
});
