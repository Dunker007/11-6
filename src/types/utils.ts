/**
 * Type Utilities
 * 
 * PURPOSE:
 * Shared type utilities and type guards for better type safety across the codebase.
 * Provides SafeAny type alias, type guard utilities, and generic utility types.
 * 
 * USAGE:
 * ```typescript
 * import { SafeAny, isString, isObject } from '@/types/utils';
 * 
 * // Safe any with warning
 * const data: SafeAny = someDynamicValue;
 * 
 * // Type guards
 * if (isString(value)) {
 *   // value is string here
 * }
 * ```
 */

/**
 * SafeAny - Use sparingly with justification
 * JSDoc warning to discourage unnecessary use
 * 
 * @deprecated Prefer specific types or unknown with type guards
 */
export type SafeAny = any; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Type guard: Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard: Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard: Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard: Check if value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard: Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard: Check if value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard: Check if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Extract keys of an object type where values match a certain type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract promise type
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : never;

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

