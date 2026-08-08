import { describe, expect, test } from 'vitest';
import { AxiosError, AxiosResponse } from 'axios';
import {
  isRateLimitError,
  parseAPIError,
  RATE_LIMIT_ERROR_MESSAGE,
  RATE_LIMIT_ERROR_MESSAGE_PLAIN,
  RATE_LIMIT_STATUS,
} from './parseAPIError';

const makeAxiosError = (status: number, data: unknown = {}): AxiosError => {
  const response = { status, data, statusText: '', headers: {}, config: {} } as AxiosResponse;
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response);
};

describe('isRateLimitError', () => {
  test('is true for an axios 429', () => {
    expect(isRateLimitError(makeAxiosError(RATE_LIMIT_STATUS))).toBe(true);
  });

  test('is false for other axios statuses', () => {
    expect(isRateLimitError(makeAxiosError(500))).toBe(false);
  });

  test('is false for non-axios errors', () => {
    expect(isRateLimitError(new Error('boom'))).toBe(false);
    expect(isRateLimitError('nope')).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});

describe('parseAPIError with 429', () => {
  test('returns the plain rate-limit message for a 429', () => {
    expect(parseAPIError(makeAxiosError(RATE_LIMIT_STATUS))).toBe(RATE_LIMIT_ERROR_MESSAGE_PLAIN);
  });

  test('rate-limit message wins over any body message on a 429', () => {
    const error = makeAxiosError(RATE_LIMIT_STATUS, { message: 'rate-limit-exceeded' });
    expect(parseAPIError(error)).toBe(RATE_LIMIT_ERROR_MESSAGE_PLAIN);
  });

  test('does not push account creation (no auth context here)', () => {
    expect(parseAPIError(makeAxiosError(RATE_LIMIT_STATUS))).not.toMatch(/account/i);
  });

  test('the anonymous surface copy still encourages account creation', () => {
    expect(RATE_LIMIT_ERROR_MESSAGE).toMatch(/account/i);
  });

  test('non-429 errors still use the body message', () => {
    const error = makeAxiosError(500, { message: 'Boom from server' });
    expect(parseAPIError(error)).toBe('Boom from server');
  });
});
