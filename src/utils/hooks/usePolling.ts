import { useEffect, useRef } from 'react';

/**
 * Polls a function at a specified interval
 * @param callback Function to call on each poll
 * @param delay Delay in milliseconds between polls (default: 5000ms)
 * @param enabled Whether polling is enabled (default: true)
 */
export function usePolling(
  callback: () => void | Promise<void>,
  delay: number = 5000,
  enabled: boolean = true
): void {
  const savedCallback = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delay <= 0) return;

    // Call immediately on mount
    savedCallback.current();

    // Set up interval
    const intervalId = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearInterval(intervalId);
    };
  }, [delay, enabled]);
}

