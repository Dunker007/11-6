interface SlowOperationEntry {
  label: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const SLOW_OPERATIONS: SlowOperationEntry[] = [];
const MAX_ENTRIES = 50;

function recordSlowOperation(entry: SlowOperationEntry, thresholdMs: number) {
  if (entry.duration < thresholdMs) {
    return;
  }

  SLOW_OPERATIONS.unshift(entry);
  if (SLOW_OPERATIONS.length > MAX_ENTRIES) {
    SLOW_OPERATIONS.pop();
  }

  console.warn(
    `[Performance] ${entry.label} took ${entry.duration.toFixed(1)}ms (threshold ${thresholdMs}ms)`,
    entry.metadata
  );
}

/**
 * Measure an async operation and record it if it exceeds the threshold.
 */
export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>,
  thresholdMs: number = 200,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();
  try {
    return await operation();
  } finally {
    const duration = performance.now() - start;
    recordSlowOperation({ label, duration, timestamp: Date.now(), metadata }, thresholdMs);
  }
}

/**
 * Measure the time a synchronous render/update takes.
 */
export function measureRender<T>(
  label: string,
  renderFn: () => T,
  thresholdMs: number = 16,
  metadata?: Record<string, unknown>
): T {
  const start = performance.now();
  try {
    return renderFn();
  } finally {
    const duration = performance.now() - start;
    recordSlowOperation({ label, duration, timestamp: Date.now(), metadata }, thresholdMs);
  }
}

/**
 * Access the most recent slow operations (for dashboards or debugging).
 */
export function getSlowOperations(): SlowOperationEntry[] {
  return [...SLOW_OPERATIONS];
}

/**
 * Manually record a slow operation when you already have duration measured.
 */
export function logSlowOperation(
  label: string,
  duration: number,
  thresholdMs: number = 200,
  metadata?: Record<string, unknown>
): void {
  recordSlowOperation({ label, duration, timestamp: Date.now(), metadata }, thresholdMs);
}


