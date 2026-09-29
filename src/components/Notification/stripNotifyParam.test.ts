import { describe, expect, test } from 'vitest';
import { stripNotifyParam } from './stripNotifyParam';

describe('stripNotifyParam', () => {
  test('removes the notify param', () => {
    expect(stripNotifyParam('/search?q=star&notify=account-logout-success')).toBe('/search?q=star');
  });

  test('removes repeated notify params', () => {
    expect(stripNotifyParam('/search?notify=account-login-success&notify=account-logout-success')).toBe('/search');
  });

  test('keeps the rest of the query and the hash', () => {
    expect(stripNotifyParam('/search?q=star&notify=account-logout-success&sort=date#results')).toBe(
      '/search?q=star&sort=date#results',
    );
  });

  test('returns paths without a notify param unchanged', () => {
    expect(stripNotifyParam('/search?q=star')).toBe('/search?q=star');
    expect(stripNotifyParam('/')).toBe('/');
  });
});
