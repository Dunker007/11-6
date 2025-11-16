/**
 * Zustand Performance Utilities
 * Helpers for optimizing Zustand store subscriptions
 */

import { shallow } from 'zustand/shallow';

/**
 * Shallow equality selector for Zustand stores
 * Prevents unnecessary re-renders when selecting multiple values
 * 
 * @example
 * ```typescript
 * const { models, isLoading } = useLLMStore(
 *   shallowSelector((state) => ({
 *     models: state.models,
 *     isLoading: state.isLoading
 *   }))
 * );
 * ```
 */
export function shallowSelector<T, U>(selector: (state: T) => U) {
  return (state: T) => selector(state);
}

/**
 * Export shallow for direct use
 */
export { shallow };

/**
 * Create a memoized selector that only updates when specific fields change
 * 
 * @example
 * ```typescript
 * const selectModels = createSelector(
 *   (state: LLMStore) => state.models
 * );
 * const models = useLLMStore(selectModels);
 * ```
 */
export function createSelector<T, U>(selector: (state: T) => U) {
  let lastResult: U | undefined;
  let lastState: T | undefined;
  
  return (state: T): U => {
    if (state === lastState) {
      return lastResult as U;
    }
    
    const result = selector(state);
    
    // Use shallow comparison for objects/arrays
    if (
      result !== lastResult &&
      (typeof result === 'object' && typeof lastResult === 'object')
    ) {
      const resultKeys = Object.keys(result as any);
      const lastKeys = Object.keys(lastResult as any);
      
      if (
        resultKeys.length === lastKeys.length &&
        resultKeys.every(key => (result as any)[key] === (lastResult as any)[key])
      ) {
        return lastResult as U;
      }
    }
    
    lastState = state;
    lastResult = result;
    return result;
  };
}

