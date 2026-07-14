import axios, { AxiosError } from 'axios';
import { find, paths, pipe } from 'ramda';
import { isString } from '@/utils/common/guards';

/**
 * @description Options for configuring error message.
 *
 * @typedef {Object} getErrorMessageOptions
 * @property {string} defaultMessage - The default message to return if no specific error message is found.
 */
type getErrorMessageOptions = {
  defaultMessage: string;
};

// HTTP 429. Both the node edge limiter and the upstream API gateway return this
// status, so keying on it routes every rate-limit error through one path.
export const RATE_LIMIT_STATUS = 429;

// Account creation is the real remedy: signed-in accounts get higher upstream
// limits, and the upstream quota resets slowly (daily), so "try again later" is
// deliberately soft rather than promising a quick retry.
export const RATE_LIMIT_REGISTER_HREF = '/user/account/register';
export const RATE_LIMIT_ERROR_TITLE = 'Rate limit reached';
export const RATE_LIMIT_ERROR_MESSAGE =
  'You’ve made too many requests. Create a free account for higher limits, or try again later.';

// No-CTA variant: for authenticated users (nothing to sign up for) and for
// auth-unaware surfaces like parseAPIError, which can't tell who's asking.
export const RATE_LIMIT_ERROR_MESSAGE_PLAIN = 'You’ve made too many requests. Please try again later.';

// True for an axios HTTP 429 (rate limited) from either the node edge limiter
// or the upstream API gateway.
export const isRateLimitError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === RATE_LIMIT_STATUS;

/**
 * Parses an API error and returns a human-readable error message.
 *
 * @param {AxiosError<unknown> | Error | unknown} error - The error object to parse, which can be an AxiosError, a generic Error, or an unknown error type.
 * @param {getErrorMessageOptions} [options] - The options object to provide additional configurations.
 * @param {string} [options.defaultMessage='Unknown Server Error'] - The default message to return if extraction of error message fails.
 * @returns {string} - The parsed error message, or the default message if no specific error message can be determined.
 */
export const parseAPIError = (
  error: AxiosError<unknown> | Error | unknown,
  options: getErrorMessageOptions = {
    defaultMessage: 'Unknown Server Error',
  },
): string => {
  const pathStrings = [
    ['user-message'],
    ['response', 'data', 'user-message'],
    ['response', 'data', 'message'],
    ['response', 'data', 'error'],
    ['response', 'statusText'],
    ['message'],
  ];

  // if it's a simple string, return it as is
  if (typeof error === 'string') {
    return error;
  }

  // return generic message if error is invalid
  if (!error || !(error instanceof Error)) {
    return options.defaultMessage;
  }

  // 429s get dedicated copy regardless of the body message the limiter returned.
  // No account CTA here — this parser has no auth context, and the account-aware
  // surfaces (toast, inline alert, edge page) add the nudge for anonymous users.
  if (isRateLimitError(error)) {
    return RATE_LIMIT_ERROR_MESSAGE_PLAIN;
  }

  // if error is an axios error, check for a message
  if (axios.isAxiosError(error)) {
    const message = pipe<[AxiosError], (string | undefined)[], string | undefined>(
      paths(pathStrings),
      find(isString),
    )(error);

    if (typeof message === 'string') {
      return message;
    }
  }

  if (error instanceof Error && typeof error.message === 'string' && error.message.length > 0) {
    return error.message;
  }

  return options.defaultMessage;
};
