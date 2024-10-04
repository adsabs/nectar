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
