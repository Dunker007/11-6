import type { CapturedError } from '@/types/error';

/**
 * Suggest a single actionable fix based on the error message.
 */
export function suggestFix(error: CapturedError | Error | string): string {
  const message = typeof error === 'string' ? error : (error as CapturedError | Error).message ?? '';
  const normalized = message.toLowerCase();

  if (normalized.includes('timeout')) {
    return 'Retry the request or check for slow network conditions.';
  }
  if (normalized.includes('unauthorized') || normalized.includes('forbidden')) {
    return 'Verify credentials or API keys and try again.';
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'Confirm you are online and the service endpoint is accessible.';
  }
  if (normalized.includes('syntax')) {
    return 'Inspect the referenced file for syntax errors and rerun the build.';
  }

  return 'Review the error details in the console for next steps.';
}

/**
 * Determine whether an operation can be safely retried.
 */
export function isRetryable(error: CapturedError | Error | string): boolean {
  const message = typeof error === 'string' ? error : (error as CapturedError | Error).message ?? '';
  const normalized = message.toLowerCase();

  if (!normalized) {
    return true;
  }

  if (normalized.includes('timeout') || normalized.includes('failed to fetch')) {
    return true;
  }

  if (normalized.includes('unauthorized') || normalized.includes('forbidden')) {
    return false;
  }

  if (normalized.includes('syntax') || normalized.includes('referenceerror')) {
    return false;
  }

  return true;
}





