/**
 * Error Handling Utilities
 * 
 * PURPOSE:
 * Shared error handling utilities for consistent error handling across the codebase.
 * Provides wrappers for async functions, error handler factories, and error boundary helpers.
 * 
 * USAGE:
 * ```typescript
 * import { handleAsyncError, createErrorHandler } from '@/utils/errorHandling';
 * 
 * // Wrap async function
 * const safeAsyncFn = handleAsyncError(async () => {
 *   await riskyOperation();
 * }, (error) => {
 *   logger.error('Operation failed:', { error });
 * });
 * 
 * // Create error handler
 * const handleApiError = createErrorHandler('API', (error) => {
 *   showToast({ title: 'API Error', variant: 'error' });
 * });
 * ```
 */

import type React from 'react';
import { errorLogger } from '@/services/errors/errorLogger';
import { logger } from '@/services/logging/loggerService';

/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error, context?: Record<string, unknown>) => void;

/**
 * Options for handleAsyncError
 */
export interface HandleAsyncErrorOptions {
  /** Custom error handler */
  onError?: ErrorHandler;
  /** Log error to errorLogger */
  logError?: boolean;
  /** Default error message if operation fails */
  defaultErrorMessage?: string;
  /** Additional context for error logging */
  context?: Record<string, unknown>;
}

/**
 * Wrap an async function with error handling
 * 
 * @param fn - The async function to wrap
 * @param options - Error handling options
 * @returns Wrapped function that handles errors gracefully
 * 
 * @example
 * ```typescript
 * const safeLoad = handleAsyncError(
 *   async () => await loadData(),
 *   {
 *     onError: (error) => showToast({ title: 'Load failed', variant: 'error' }),
 *     logError: true,
 *   }
 * );
 * await safeLoad();
 * ```
 */
export function handleAsyncError<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: HandleAsyncErrorOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  const {
    onError,
    logError = true,
    defaultErrorMessage = 'Operation failed',
    context = {},
  } = options;

  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    try {
      return await fn(...args) as ReturnType<T>;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (logError) {
        errorLogger.logFromError('runtime', err, 'error', {
          source: 'handleAsyncError',
          ...context,
        });
      }

      if (onError) {
        onError(err, context);
      } else {
        logger.error(defaultErrorMessage, { error: err, ...context });
      }

      return null;
    }
  };
}

/**
 * Create a reusable error handler factory
 * 
 * @param source - Source identifier for error context
 * @param customHandler - Custom error handling function
 * @returns Error handler function
 * 
 * @example
 * ```typescript
 * const handleApiError = createErrorHandler('API', (error) => {
 *   showToast({ title: 'API Error', variant: 'error' });
 * });
 * 
 * try {
 *   await apiCall();
 * } catch (error) {
 *   handleApiError(error, { endpoint: '/api/data' });
 * }
 * ```
 */
export function createErrorHandler(
  source: string,
  customHandler?: ErrorHandler
): ErrorHandler {
  return (error: Error, context?: Record<string, unknown>) => {
    // Log error
    errorLogger.logFromError('runtime', error, 'error', {
      source,
      ...context,
    });

    // Call custom handler if provided
    if (customHandler) {
      customHandler(error, { source, ...context });
    }
  };
}

/**
 * HOC for creating error boundary wrappers
 * Note: This is a utility type - actual error boundary should be a React class component
 * or use react-error-boundary library
 * 
 * @example
 * ```typescript
 * // Use with react-error-boundary
 * import { ErrorBoundary } from 'react-error-boundary';
 * 
 * <ErrorBoundary
 *   FallbackComponent={ErrorFallback}
 *   onError={(error, info) => {
 *     const handler = createErrorHandler('ComponentBoundary');
 *     handler(error, { componentStack: info.componentStack });
 *   }}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: ErrorHandler;
}

/**
 * Create an error boundary wrapper configuration
 * 
 * @param options - Error boundary options
 * @returns Configuration for error boundary
 */
export function createErrorBoundaryConfig(options: {
  source: string;
  fallbackMessage?: string;
  onError?: ErrorHandler;
}): {
  onError: (error: Error, info: { componentStack?: string }) => void;
  fallback: React.ComponentType<{ error: Error; resetError: () => void }>;
} {
  const handler = createErrorHandler(options.source, options.onError);

  return {
    onError: (error: Error, info: { componentStack?: string }) => {
      handler(error, { componentStack: info.componentStack });
    },
    fallback: ({ error, resetError }: { error: Error; resetError: () => void }) => {
      return (
        <div style={{ padding: '1rem', border: '1px solid red', borderRadius: '4px' }}>
          <h3>Something went wrong</h3>
          <p>{options.fallbackMessage || error.message}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      );
    },
  };
}

/**
 * Check if error is a specific type
 */
export function isErrorType(error: unknown, type: string): boolean {
  return error instanceof Error && error.name === type;
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}

/**
 * Extract error stack safely
 */
export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

