import { describe, expect, it } from 'vitest';
import { getNotification, NOTIFICATIONS } from './notification';

describe('notification store', () => {
  describe('getNotification', () => {
    it('returns null for unknown notification id', () => {
      // @ts-expect-error - testing with invalid id
      expect(getNotification('unknown-id')).toBeNull();
    });

    it('returns correct notification for valid id', () => {
      expect(getNotification('account-login-success')).toEqual(
        NOTIFICATIONS['account-login-success'],
      );
    });
  });

  describe('orcid-session-expired notification', () => {
    it('exists in NOTIFICATIONS', () => {
      expect(NOTIFICATIONS['orcid-session-expired']).toBeDefined();
    });

    it('has warning status', () => {
      expect(NOTIFICATIONS['orcid-session-expired'].status).toBe('warning');
    });

    it('has correct id', () => {
      expect(NOTIFICATIONS['orcid-session-expired'].id).toBe('orcid-session-expired');
    });

    it('has informative message', () => {
      expect(NOTIFICATIONS['orcid-session-expired'].message).toContain('ORCiD session');
      expect(NOTIFICATIONS['orcid-session-expired'].message).toContain('log in again');
    });

    it('is retrievable via getNotification', () => {
      const notification = getNotification('orcid-session-expired');
      expect(notification).toEqual(NOTIFICATIONS['orcid-session-expired']);
    });
  });
});
