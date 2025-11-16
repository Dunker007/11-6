/**
 * formatters.ts
 * 
 * PURPOSE:
 * Centralized formatting utilities for the entire application. Single source of truth for
 * currency, percentage, date, bytes, and relative time formatting. Ensures consistent
 * formatting across all components and prevents duplicate formatting code.
 * 
 * ARCHITECTURE:
 * Pure utility functions with no dependencies on application state:
 * - Currency formatting (USD, compact notation)
 * - Percentage formatting (with sign options)
 * - Date formatting (short, medium, long, relative, datetime)
 * - Bytes formatting (human-readable)
 * - Relative time formatting (time ago)
 * 
 * CURRENT STATUS:
 * ✅ Currency formatting (standard and compact)
 * ✅ Percentage formatting with sign option
 * ✅ Date formatting (multiple styles)
 * ✅ Bytes formatting
 * ✅ Relative time formatting
 * ✅ All formatters used across 15+ components
 * 
 * DEPENDENCIES:
 * - None (pure utility functions)
 * 
 * STATE MANAGEMENT:
 * - Stateless utilities (no state)
 * - No Zustand or React dependencies
 * 
 * PERFORMANCE:
 * - Efficient Intl API usage
 * - No side effects
 * - Fast execution
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { formatCurrency, formatPercent, formatDate } from '@/utils/formatters';
 * 
 * // Currency
 * formatCurrency(1234.56); // "$1,234.56"
 * formatCurrency(1234.56, { minimumFractionDigits: 0 }); // "$1,235"
 * 
 * // Percentage
 * formatPercent(0.15, 2, false, true); // "+15.00%"
 * 
 * // Date
 * formatDate(new Date(), 'medium'); // "Jan 15, 2025"
 * formatDate(new Date(), 'relative'); // "2 hours ago"
 * ```
 * 
 * RELATED FILES:
 * - src/components/LLMOptimizer/WealthLab/components/AnalyticsDashboard.tsx: Uses all formatters
 * - src/components/LLMOptimizer/WealthLab/components/*: Multiple components use formatters
 * - src/components/VibeEditor/FileExplorer.tsx: Uses formatBytes
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Support for more currencies
 * - Localization support
 * - Custom date formats
 * - Number formatting utilities
 */

/**
 * Format a number as USD currency
 * @param amount The amount to format
 * @param options Optional Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    ...options,
  }).format(amount);
}

/**
 * Format a number as a compact currency (e.g., $1.2K, $3.4M)
 * @param amount The amount to format
 * @returns Compact formatted currency string
 */
export function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/**
 * Format a number as a percentage
 * @param value The value to format (0-1 for percentage, or 0-100 if already percentage)
 * @param decimals Number of decimal places (default: 1)
 * @param isAlreadyPercent Whether the input is already a percentage (0-100)
 * @param showSign Whether to show '+' sign for positive values (default: false)
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
  isAlreadyPercent: boolean = false,
  showSign: boolean = false
): string {
  const percentage = isAlreadyPercent ? value : value * 100;
  const sign = showSign && percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(decimals)}%`;
}

/**
 * Format a date as a human-readable string
 * @param date The date to format
 * @param style Style of date formatting ('short' | 'medium' | 'long' | 'relative' | 'datetime')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number | string,
  style: 'short' | 'medium' | 'long' | 'relative' | 'datetime' = 'medium'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (style === 'relative') {
    return formatRelativeTime(dateObj);
  }

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };
  const options = optionsMap[style] || optionsMap.medium;

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a date as relative time (e.g., "2 minutes ago", "in 3 hours")
 * @param date The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
    if (count >= 1) {
      const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
      return rtf.format(diffInSeconds > 0 ? -count : count, interval.label as any);
    }
  }

  return 'just now';
}

/**
 * Format a number with thousands separators
 * @param value The number to format
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a byte size to human-readable format
 * @param bytes The byte size to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted byte string (e.g., "1.23 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format a duration in milliseconds to human-readable format
 * @param ms Duration in milliseconds
 * @returns Formatted duration string (e.g., "2h 15m", "30s")
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Alias for formatRelativeTime for backward compatibility
 * @param timestamp Timestamp (number) or Date object
 * @returns Relative time string (e.g., "2 minutes ago")
 */
export function formatTimeAgo(timestamp: number | Date): string {
  return formatRelativeTime(timestamp);
}

