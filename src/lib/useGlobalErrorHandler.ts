/**
 * Hook to initialize global error handlers
 *
 * This hook should be called once at the application root level
 * to set up window-level error handlers for uncaught errors and
 * unhandled promise rejections.
 */

import { useEffect } from 'react';
import { initializeGlobalErrorHandlers } from './errorHandler';

/**
 * Initializes global error handlers on mount
 * Should be called in the root layout or app component
 */
export function useGlobalErrorHandler(): void {
  useEffect(() => {
    const cleanup = initializeGlobalErrorHandlers();
    return cleanup;
  }, []);
}
