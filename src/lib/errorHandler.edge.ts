/**
 * Edge-Compatible Error Handler
 *
 * A lightweight version of the global error handler designed for Edge Runtime
 * Does not import axios to avoid Edge Runtime warnings
 */

import { edgeLogger } from '@/logger';
import * as Sentry from '@sentry/nextjs';

/**
 * Error severity levels aligned with Sentry's levels
 */
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Error source indicates where the error originated
 */
export enum ErrorSource {
  WINDOW = 'window',
  PROMISE = 'unhandled-promise',
  REACT_QUERY = 'react-query',
  ERROR_BOUNDARY = 'error-boundary',
  API = 'api',
  MANUAL = 'manual',
  MIDDLEWARE = 'middleware',
  SERVER = 'server',
}

/**
 * Standard error format that all errors are normalized to
 */
export interface StandardError {
  message: string;
  name: string;
  stack?: string;
  originalError: unknown;
  source: ErrorSource;
  severity: ErrorSeverity;
  context?: Record<string, unknown>;
  timestamp: number;
  statusCode?: number;
  url?: string;
}

/**
 * Options for the error handler
 */
export interface ErrorHandlerOptions {
  source?: ErrorSource;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  skipLogging?: boolean;
  skipSentry?: boolean;
  tags?: Record<string, string | number | boolean>;
  fingerprint?: string[];
  user?: Sentry.User;
}

/**
 * Normalizes any error type into a StandardError format
 * Edge-compatible version without axios dependency
 */
export function normalizeError(error: unknown, options: ErrorHandlerOptions = {}): StandardError {
  const { source = ErrorSource.MANUAL, severity = ErrorSeverity.ERROR, context = {} } = options;

  const timestamp = Date.now();
  let message = 'An unknown error occurred';
  let name = 'UnknownError';
  let stack: string | undefined;
  let statusCode: number | undefined;
  let url: string | undefined;

  if (error instanceof Error) {
    message = error.message;
    name = error.name;
    stack = error.stack;
  } else if (typeof error === 'string') {
    message = error;
    name = 'StringError';
  } else if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    message = String(errorObj.message || errorObj.error || 'Unknown error');
    name = String(errorObj.name || 'ObjectError');
    stack = errorObj.stack as string | undefined;
    statusCode = errorObj.status as number | undefined;
    url = errorObj.url as string | undefined;
  }

  return {
    message,
    name,
    stack,
    originalError: error,
    source,
    severity,
    context,
    timestamp,
    statusCode,
    url,
  };
}

/**
 * Logs a standardized error using edge-compatible logger
 */
function logError(standardError: StandardError): void {
  const logData = {
    errorName: standardError.name,
    errorMessage: standardError.message,
    source: standardError.source,
    severity: standardError.severity,
    context: standardError.context,
    statusCode: standardError.statusCode,
    url: standardError.url,
    timestamp: standardError.timestamp,
    stack: standardError.stack,
  };

  switch (standardError.severity) {
    case ErrorSeverity.DEBUG:
      edgeLogger.debug(logData, standardError.message);
      break;
    case ErrorSeverity.INFO:
      edgeLogger.info(logData, standardError.message);
      break;
    case ErrorSeverity.WARNING:
      edgeLogger.warn(logData, standardError.message);
      break;
    case ErrorSeverity.FATAL:
    case ErrorSeverity.ERROR:
    default:
      edgeLogger.error(logData, standardError.message);
      break;
  }
}

/**
 * Reports a standardized error to Sentry
 */
function reportToSentry(standardError: StandardError, options: ErrorHandlerOptions = {}): void {
  const { tags = {}, fingerprint, user } = options;

  Sentry.withScope((scope) => {
    if (user) {
      scope.setUser(user);
    }

    scope.setLevel(standardError.severity as Sentry.SeverityLevel);

    Object.entries({
      ...tags,
      source: standardError.source,
      errorName: standardError.name,
    }).forEach(([key, value]) => {
      scope.setTag(key, String(value));
    });

    Object.entries({
      ...standardError.context,
      timestamp: standardError.timestamp,
      statusCode: standardError.statusCode,
      url: standardError.url,
    }).forEach(([key, value]) => {
      if (value !== undefined) {
        scope.setExtra(key, value);
      }
    });

    if (fingerprint) {
      scope.setFingerprint(fingerprint);
    }

    if (standardError.originalError instanceof Error) {
      Sentry.captureException(standardError.originalError);
    } else {
      Sentry.captureMessage(standardError.message);
    }
  });
}

/**
 * Edge-compatible error handler - the main entry point
 */
export function handleError(error: unknown, options: ErrorHandlerOptions = {}): StandardError {
  const { skipLogging = false, skipSentry = false } = options;

  const standardError = normalizeError(error, options);

  if (!skipLogging) {
    logError(standardError);
  }

  if (!skipSentry) {
    reportToSentry(standardError, options);
  }

  return standardError;
}

/**
 * Utility to create an error handler with pre-configured options
 */
export function createErrorHandler(defaultOptions: ErrorHandlerOptions) {
  return (error: unknown, options: ErrorHandlerOptions = {}): StandardError => {
    return handleError(error, {
      ...defaultOptions,
      ...options,
      context: {
        ...defaultOptions.context,
        ...options.context,
      },
      tags: {
        ...defaultOptions.tags,
        ...options.tags,
      },
    });
  };
}
