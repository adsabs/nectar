import axios from 'axios';

/**
 * HTTP status codes that indicate transient failures that should be retried.
 */
const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * HTTP status codes that indicate client errors that should NOT be retried.
 */
const NON_RETRYABLE_CLIENT_ERRORS = new Set([
  400, // Bad Request (e.g., invalid query syntax)
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  405, // Method Not Allowed
  409, // Conflict
  410, // Gone
  422, // Unprocessable Entity
]);

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Calculates exponential backoff delay with jitter.
 */
export function calculateBackoffDelay(retryCount: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
  const exponentialDelay = config.baseDelay * Math.pow(2, retryCount);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

/**
 * Determines if an error is a network/connection error (no response received).
 */
export function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  return !error.response && Boolean(error.request);
}

/**
 * Determines if an error is a timeout error.
 */
export function isTimeoutError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
}

/**
 * Determines if an HTTP status code is retryable.
 */
export function isRetryableStatusCode(status: number | undefined): boolean {
  if (status === undefined) {
    return true;
  }
  return RETRYABLE_STATUS_CODES.has(status);
}

/**
 * Determines if an error should not be retried based on status code.
 */
export function isNonRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const status = error.response?.status;
  if (status === undefined) {
    return false;
  }
  return NON_RETRYABLE_CLIENT_ERRORS.has(status);
}

/**
 * Determines if a request should be retried based on the error and retry count.
 * This is the primary function to use for React Query retry configuration.
 */
export function shouldRetry(failCount: number, error: unknown, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  if (failCount >= config.maxRetries) {
    return false;
  }

  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (isNonRetryableError(error)) {
    return false;
  }

  if (isNetworkError(error) || isTimeoutError(error)) {
    return true;
  }

  return isRetryableStatusCode(error.response?.status);
}

/**
 * Creates a retry function for React Query with custom configuration.
 */
export function createRetryFn(config: Partial<RetryConfig> = {}) {
  const mergedConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  return (failCount: number, error: unknown) => shouldRetry(failCount, error, mergedConfig);
}

/**
 * Retry delay function for React Query.
 * Calculates backoff delay based on the retry count.
 */
export function retryDelayFn(retryCount: number): number {
  return calculateBackoffDelay(retryCount);
}

/**
 * Categorizes an error into a user-friendly type for display.
 */
export type ErrorCategory =
  | 'network'
  | 'timeout'
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'client_error'
  | 'server_error'
  | 'unknown';

export function categorizeError(error: unknown): ErrorCategory {
  if (!axios.isAxiosError(error)) {
    return 'unknown';
  }

  if (isNetworkError(error)) {
    return 'network';
  }

  if (isTimeoutError(error)) {
    return 'timeout';
  }

  const status = error.response?.status;

  if (status === undefined) {
    return 'unknown';
  }

  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 429:
      return 'rate_limited';
    default:
      if (status >= 400 && status < 500) {
        return 'client_error';
      }
      if (status >= 500) {
        return 'server_error';
      }
      return 'unknown';
  }
}

/**
 * Returns a user-friendly error message based on error category.
 */
export function getErrorMessage(error: unknown): string {
  const category = categorizeError(error);

  switch (category) {
    case 'network':
      return 'Unable to connect. Please check your internet connection and try again.';
    case 'timeout':
      return 'The request took too long to complete. Please try again.';
    case 'not_found':
      return 'The requested resource could not be found.';
    case 'unauthorized':
      return 'Your session has expired. Please sign in again.';
    case 'forbidden':
      return 'You do not have permission to access this resource.';
    case 'rate_limited':
      return 'Too many requests. Please wait a moment and try again.';
    case 'client_error':
      return 'There was a problem with your request. Please check your input and try again.';
    case 'server_error':
      return 'The server encountered an error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Determines if an error category is likely transient and worth retrying.
 */
export function isTransientError(error: unknown): boolean {
  const category = categorizeError(error);
  return ['network', 'timeout', 'rate_limited', 'server_error'].includes(category);
}
