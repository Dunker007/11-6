/**
 * Performance Optimization Utilities
 *
 * Provides utilities for optimizing React component performance.
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Lazy load a component with retry logic
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3
): LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptImport = (attemptsLeft: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft <= 0) {
              reject(error);
              return;
            }
            const delay = (4 - attemptsLeft) * 1000;
            setTimeout(() => attemptImport(attemptsLeft - 1), delay);
          });
      };
      attemptImport(retries);
    });
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, wait);
    }
  };
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Performance monitoring
 */
interface SlowOperation {
  name: string;
  duration: number;
  timestamp: number;
}

const slowOperations: SlowOperation[] = [];
const SLOW_THRESHOLD = 100; // ms

export function logSlowOperation(name: string, duration: number): void {
  if (duration > SLOW_THRESHOLD) {
    slowOperations.push({ name, duration, timestamp: Date.now() });
    console.warn(`Slow operation: ${name} took ${duration}ms`);
  }
}

export function getSlowOperations(): SlowOperation[] {
  return [...slowOperations];
}

export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    logSlowOperation(name, duration);
  }
}

export function measureRender(componentName: string): () => void {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    logSlowOperation(`Render: ${componentName}`, duration);
  };
}
