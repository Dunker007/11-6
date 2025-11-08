/**
 * LocalStorage Manager
 * Monitors and manages localStorage usage to prevent quota exceeded errors
 */

export interface StorageInfo {
  used: number; // in bytes
  available: number; // in bytes
  total: number; // in bytes (usually 5-10MB depending on browser)
  usagePercent: number;
}

class StorageManager {
  private static instance: StorageManager;
  private readonly QUOTA_WARNING_THRESHOLD = 0.75; // Warn at 75% usage
  private readonly QUOTA_CRITICAL_THRESHOLD = 0.9; // Critical at 90% usage

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Get current localStorage usage information
   */
  getStorageInfo(): StorageInfo {
    let used = 0;
    
    // Calculate used space
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const item = localStorage.getItem(key);
        if (item) {
          // Count both key and value size (in characters, approximating bytes for UTF-16)
          used += key.length + item.length;
        }
      }
    }

    // Most browsers have a 5-10MB limit, let's assume 5MB (5242880 bytes) conservatively
    const total = 5242880; // 5MB in bytes
    const available = total - used;
    const usagePercent = (used / total) * 100;

    return {
      used,
      available,
      total,
      usagePercent,
    };
  }

  /**
   * Check if storage is approaching quota limits
   * @returns Object with warning status and message
   */
  checkQuota(): { isWarning: boolean; isCritical: boolean; message?: string; info: StorageInfo } {
    const info = this.getStorageInfo();
    const percent = info.usagePercent / 100;

    if (percent >= this.QUOTA_CRITICAL_THRESHOLD) {
      return {
        isWarning: true,
        isCritical: true,
        message: `LocalStorage is critically full (${info.usagePercent.toFixed(1)}%). Some features may not work. Consider clearing old data.`,
        info,
      };
    }

    if (percent >= this.QUOTA_WARNING_THRESHOLD) {
      return {
        isWarning: true,
        isCritical: false,
        message: `LocalStorage is ${info.usagePercent.toFixed(1)}% full. Consider clearing old data to prevent issues.`,
        info,
      };
    }

    return {
      isWarning: false,
      isCritical: false,
      info,
    };
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  /**
   * Get storage breakdown by key prefix
   */
  getStorageBreakdown(): { key: string; size: number; sizeFormatted: string }[] {
    const breakdown: { key: string; size: number; sizeFormatted: string }[] = [];

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const item = localStorage.getItem(key);
        if (item) {
          const size = key.length + item.length;
          breakdown.push({
            key,
            size,
            sizeFormatted: this.formatBytes(size),
          });
        }
      }
    }

    // Sort by size descending
    return breakdown.sort((a, b) => b.size - a.size);
  }

  /**
   * Clear old data from specific key prefixes
   * @param prefixes Array of key prefixes to target for cleanup
   */
  clearOldData(prefixes: string[]): { cleared: number; freedBytes: number } {
    let cleared = 0;
    let freedBytes = 0;

    const keysToRemove: string[] = [];

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        for (const prefix of prefixes) {
          if (key.startsWith(prefix)) {
            const item = localStorage.getItem(key);
            if (item) {
              freedBytes += key.length + item.length;
            }
            keysToRemove.push(key);
            break;
          }
        }
      }
    }

    // Remove identified keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleared++;
    });

    return { cleared, freedBytes };
  }

  /**
   * Log current storage status to console
   */
  logStorageStatus(): void {
    const info = this.getStorageInfo();
    const breakdown = this.getStorageBreakdown();

    console.group('📦 LocalStorage Status');
    console.log(`Used: ${this.formatBytes(info.used)} / ${this.formatBytes(info.total)} (${info.usagePercent.toFixed(1)}%)`);
    console.log(`Available: ${this.formatBytes(info.available)}`);
    
    if (breakdown.length > 0) {
      console.group('Storage Breakdown (Top 10):');
      breakdown.slice(0, 10).forEach(({ key, sizeFormatted }) => {
        console.log(`  ${key}: ${sizeFormatted}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

export const storageManager = StorageManager.getInstance();

