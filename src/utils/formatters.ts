/**
 * Centralized formatting utilities
 * Single source of truth for all data formatting across the application
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
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
  isAlreadyPercent: boolean = false
): string {
  const percentage = isAlreadyPercent ? value : value * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format a date as a human-readable string
 * @param date The date to format
 * @param style Style of date formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | number | string,
  style: 'short' | 'medium' | 'long' | 'relative' = 'medium'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  if (style === 'relative') {
    return formatRelativeTime(dateObj);
  }

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' },
  };
  const options = optionsMap[style];

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

