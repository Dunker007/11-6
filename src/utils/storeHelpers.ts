/**
 * storeHelpers.ts
 * 
 * PURPOSE:
 * Shared utility functions for Zustand stores to reduce code duplication.
 * Provides common patterns for async operations, error handling, and loading states.
 * 
 * ARCHITECTURE:
 * Pure utility functions that:
 * - Wrap async operations with loading/error state management
 * - Provide consistent error handling patterns
 * - Reduce boilerplate in store implementations
 * 
 * CURRENT STATUS:
 * ✅ Async operation wrapper with loading/error handling
 * ✅ Error extraction utility
 * ✅ Consistent error logging integration
 * 
 * DEPENDENCIES:
 * - errorLogger: Error logging service
 * 
 * STATE MANAGEMENT:
 * - Stateless utilities (no state)
 * 
 * PERFORMANCE:
 * - Lightweight wrappers
 * - No performance overhead
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { withAsyncOperation } from '@/utils/storeHelpers';
 * 
 * const myAction = async (params) => {
 *   return withAsyncOperation(
 *     async () => {
 *       return await myService.doSomething(params);
 *     },
 *     (error) => set({ error: error.message }),
 *     () => set({ isLoading: true }),
 *     () => set({ isLoading: false })
 *   );
 * };
 * ```
 * 
 * RELATED FILES:
 * - src/services/[domain]/[name]Store.ts: Uses these helpers
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Add retry logic wrapper
 * - Add debounce wrapper for store actions
 * - Add optimistic update helpers
 */
import { errorLogger } from '@/services/errors/errorLogger';
import type { ErrorCategory } from '@/types/error';

/**
 * Extracts error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Wraps an async operation with loading and error state management
 * 
 * @param operation - The async operation to execute
 * @param onError - Callback when error occurs (receives error message)
 * @param onStart - Callback when operation starts (optional)
 * @param onComplete - Callback when operation completes (optional)
 * @param logError - Whether to log error to errorLogger (default: true)
 * @param errorCategory - Category for error logging (default: 'store')
 * @param errorSource - Source identifier for error logging (optional)
 * @returns Promise with operation result or null on error
 */
export async function withAsyncOperation<T>(
  operation: () => Promise<T>,
  onError: (errorMessage: string) => void,
  onStart?: () => void,
  onComplete?: () => void,
  logError: boolean = true,
  errorCategory: ErrorCategory = 'runtime',
  errorSource?: string
): Promise<T | null> {
  try {
    onStart?.();
    const result = await operation();
    onComplete?.();
    return result;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    onError(errorMessage);
    onComplete?.();
    
    if (logError) {
      errorLogger.logFromError(errorCategory, error as Error, 'error', {
        source: errorSource || 'store',
      });
    }
    
    return null;
  }
}

/**
 * Wraps an async operation with loading state management (no error state)
 * Useful for operations that handle errors internally
 */
export async function withLoadingState<T>(
  operation: () => Promise<T>,
  onStart: () => void,
  onComplete: () => void
): Promise<T | null> {
  try {
    onStart();
    const result = await operation();
    onComplete();
    return result;
  } catch (error) {
    onComplete();
    errorLogger.logFromError('runtime', error as Error, 'error', {
      source: 'store',
    });
    return null;
  }
}

/**
 * Creates a standard async action handler for stores
 * Sets isLoading and error state automatically
 */
export function createAsyncAction<T>(
  set: (partial: { isLoading: boolean; error: string | null }) => void,
  operation: () => Promise<T>,
  onSuccess?: (result: T) => void,
  errorSource?: string
): () => Promise<T | null> {
  return async () => {
    const result = await withAsyncOperation(
      operation,
      (errorMessage) => set({ error: errorMessage, isLoading: false }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false, error: null }),
      true,
      'runtime',
      errorSource
    );
    if (result && onSuccess) {
      onSuccess(result);
    }
    return result;
  };
}

