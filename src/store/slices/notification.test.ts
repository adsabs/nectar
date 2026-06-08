import { describe, expect, test } from 'vitest';
import { getNotification, NOTIFICATIONS } from './notification';

describe('notification store', () => {
  describe('getNotification', () => {
    test('returns null for unknown notification id', () => {
      // @ts-expect-error - testing with invalid id
      expect(getNotification('unknown-id')).toBeNull();
    });

    test('returns correct notification for valid id', () => {
      expect(getNotification('account-login-success')).toEqual(NOTIFICATIONS['account-login-success']);
    });
  });

  describe('orcid-session-expired notification', () => {
    test('exists in NOTIFICATIONS', () => {
      expect(NOTIFICATIONS['orcid-session-expired']).toBeDefined();
    });

    test('has warning status', () => {
      expect(NOTIFICATIONS['orcid-session-expired'].status).toBe('warning');
    });

    test('has correct id', () => {
      expect(NOTIFICATIONS['orcid-session-expired'].id).toBe('orcid-session-expired');
    });

    test('has informative message', () => {
      expect(NOTIFICATIONS['orcid-session-expired'].message).toContain('ORCiD session');
      expect(NOTIFICATIONS['orcid-session-expired'].message).toContain('log in again');
    });

    test('is retrievable via getNotification', () => {
      const notification = getNotification('orcid-session-expired');
      expect(notification).toEqual(NOTIFICATIONS['orcid-session-expired']);
    });
  });
});
