import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import {
  shouldRetry,
  isNetworkError,
  isTimeoutError,
  isRetryableStatusCode,
  isNonRetryableError,
  categorizeError,
  getErrorMessage,
  isTransientError,
  calculateBackoffDelay,
  DEFAULT_RETRY_CONFIG,
} from '../retry';

const createAxiosError = (status?: number, code?: string, hasResponse = true, hasRequest = true): AxiosError => {
  const error = new Error('Test error') as AxiosError;
  error.isAxiosError = true;
  error.code = code;
  error.response = hasResponse ? ({ status } as AxiosError['response']) : undefined;
  error.request = hasRequest ? {} : undefined;
  error.config = {} as AxiosError['config'];
  error.toJSON = () => ({});
  return error;
};

describe('retry utilities', () => {
  describe('isNetworkError', () => {
    it('returns true for network errors (no response, has request)', () => {
      const error = createAxiosError(undefined, undefined, false, true);
      expect(isNetworkError(error)).toBe(true);
    });

    it('returns false when there is a response', () => {
      const error = createAxiosError(500);
      expect(isNetworkError(error)).toBe(false);
    });

    it('returns false for non-axios errors', () => {
      expect(isNetworkError(new Error('test'))).toBe(false);
    });
  });

  describe('isTimeoutError', () => {
    it('returns true for ECONNABORTED', () => {
      const error = createAxiosError(undefined, 'ECONNABORTED');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('returns true for ETIMEDOUT', () => {
      const error = createAxiosError(undefined, 'ETIMEDOUT');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('returns false for other codes', () => {
      const error = createAxiosError(500, 'ENOTFOUND');
      expect(isTimeoutError(error)).toBe(false);
    });
  });

  describe('isRetryableStatusCode', () => {
    it('returns true for 408 Request Timeout', () => {
      expect(isRetryableStatusCode(408)).toBe(true);
    });

    it('returns true for 429 Too Many Requests', () => {
      expect(isRetryableStatusCode(429)).toBe(true);
    });

    it('returns true for 5xx server errors', () => {
      expect(isRetryableStatusCode(500)).toBe(true);
      expect(isRetryableStatusCode(502)).toBe(true);
      expect(isRetryableStatusCode(503)).toBe(true);
      expect(isRetryableStatusCode(504)).toBe(true);
    });

    it('returns false for 4xx client errors', () => {
      expect(isRetryableStatusCode(400)).toBe(false);
      expect(isRetryableStatusCode(401)).toBe(false);
      expect(isRetryableStatusCode(404)).toBe(false);
    });

    it('returns true for undefined status (no response)', () => {
      expect(isRetryableStatusCode(undefined)).toBe(true);
    });
  });

  describe('isNonRetryableError', () => {
    it('returns true for 400 Bad Request', () => {
      const error = createAxiosError(400);
      expect(isNonRetryableError(error)).toBe(true);
    });

    it('returns true for 404 Not Found', () => {
      const error = createAxiosError(404);
      expect(isNonRetryableError(error)).toBe(true);
    });

    it('returns false for 500 Server Error', () => {
      const error = createAxiosError(500);
      expect(isNonRetryableError(error)).toBe(false);
    });
  });

  describe('shouldRetry', () => {
    it('returns false when max retries exceeded', () => {
      const error = createAxiosError(500);
      expect(shouldRetry(2, error)).toBe(false);
    });

    it('returns false for non-axios errors', () => {
      expect(shouldRetry(0, new Error('test'))).toBe(false);
    });

    it('returns false for 400 Bad Request', () => {
      const error = createAxiosError(400);
      expect(shouldRetry(0, error)).toBe(false);
    });

    it('returns true for network errors', () => {
      const error = createAxiosError(undefined, undefined, false, true);
      expect(shouldRetry(0, error)).toBe(true);
    });

    it('returns true for timeout errors', () => {
      const error = createAxiosError(undefined, 'ECONNABORTED');
      expect(shouldRetry(0, error)).toBe(true);
    });

    it('returns true for 500 Server Error', () => {
      const error = createAxiosError(500);
      expect(shouldRetry(0, error)).toBe(true);
    });

    it('returns true for 503 Service Unavailable', () => {
      const error = createAxiosError(503);
      expect(shouldRetry(0, error)).toBe(true);
    });
  });

  describe('categorizeError', () => {
    it('returns network for network errors', () => {
      const error = createAxiosError(undefined, undefined, false, true);
      expect(categorizeError(error)).toBe('network');
    });

    it('returns timeout for timeout errors', () => {
      const error = createAxiosError(undefined, 'ECONNABORTED');
      expect(categorizeError(error)).toBe('timeout');
    });

    it('returns not_found for 404', () => {
      const error = createAxiosError(404);
      expect(categorizeError(error)).toBe('not_found');
    });

    it('returns unauthorized for 401', () => {
      const error = createAxiosError(401);
      expect(categorizeError(error)).toBe('unauthorized');
    });

    it('returns rate_limited for 429', () => {
      const error = createAxiosError(429);
      expect(categorizeError(error)).toBe('rate_limited');
    });

    it('returns server_error for 5xx', () => {
      const error = createAxiosError(500);
      expect(categorizeError(error)).toBe('server_error');
    });

    it('returns unknown for non-axios errors', () => {
      expect(categorizeError(new Error('test'))).toBe('unknown');
    });
  });

  describe('getErrorMessage', () => {
    it('returns network message for network errors', () => {
      const error = createAxiosError(undefined, undefined, false, true);
      expect(getErrorMessage(error)).toContain('internet connection');
    });

    it('returns timeout message for timeout errors', () => {
      const error = createAxiosError(undefined, 'ECONNABORTED');
      expect(getErrorMessage(error)).toContain('too long');
    });

    it('returns rate limit message for 429', () => {
      const error = createAxiosError(429);
      expect(getErrorMessage(error)).toContain('Too many requests');
    });
  });

  describe('isTransientError', () => {
    it('returns true for network errors', () => {
      const error = createAxiosError(undefined, undefined, false, true);
      expect(isTransientError(error)).toBe(true);
    });

    it('returns true for server errors', () => {
      const error = createAxiosError(500);
      expect(isTransientError(error)).toBe(true);
    });

    it('returns false for client errors', () => {
      const error = createAxiosError(400);
      expect(isTransientError(error)).toBe(false);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('returns base delay for first retry', () => {
      const delay = calculateBackoffDelay(0);
      expect(delay).toBeGreaterThanOrEqual(DEFAULT_RETRY_CONFIG.baseDelay);
      expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.baseDelay * 1.3);
    });

    it('returns exponentially increasing delays', () => {
      const delay0 = calculateBackoffDelay(0);
      const delay1 = calculateBackoffDelay(1);
      const delay2 = calculateBackoffDelay(2);

      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('respects maxDelay', () => {
      const delay = calculateBackoffDelay(10, { ...DEFAULT_RETRY_CONFIG, maxDelay: 5000 });
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });
});
