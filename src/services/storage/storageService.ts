/**
 * Unified Storage Service
 * Provides robust storage with automatic quota management and IndexedDB fallback
 */

import { logger } from '../logging/loggerService';

interface StorageOptions {
  compress?: boolean;
  expiresIn?: number; // milliseconds
  priority?: 'high' | 'normal' | 'low';
}

interface StorageEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  priority: 'high' | 'normal' | 'low';
  compressed: boolean;
}

class StorageService {
  private readonly QUOTA_WARNING_THRESHOLD = 0.8; // 80% of quota
  private readonly QUOTA_CRITICAL_THRESHOLD = 0.95; // 95% of quota
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'dlx-storage';
  private readonly DB_VERSION = 1;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for large data storage
   */
  private async initIndexedDB(): Promise<void> {
    if (!window.indexedDB) {
      logger.warn('IndexedDB not available, using localStorage only');
      return;
    }

    try {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', { error: request.error?.message });
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized successfully');
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('storage')) {
          const objectStore = db.createObjectStore('storage', { keyPath: 'key' });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('priority', 'priority', { unique: false });
          objectStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    } catch (error) {
      logger.error('IndexedDB initialization failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Get current localStorage usage
   */
  private getLocalStorageUsage(): { used: number; total: number; percentage: number } {
    let used = 0;
    const total = 5 * 1024 * 1024; // 5MB typical limit

    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += key.length + (localStorage.getItem(key)?.length || 0);
        }
      }
    } catch {
      // If we can't calculate, assume worst case
      used = total * 0.9;
    }

    return {
      used,
      total,
      percentage: used / total,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('dlx-')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry = JSON.parse(item) as StorageEntry<unknown>;
              if (entry.expiresAt && entry.expiresAt < now) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Invalid JSON, remove it
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        logger.info('Cleaned up expired storage entries', { count: keysToRemove.length });
      }
    } catch (error) {
      logger.warn('Failed to cleanup expired entries', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  /**
   * Free up space by removing low-priority items
   */
  private async freeSpace(targetBytes: number): Promise<boolean> {
    const priorities: Array<'low' | 'normal' | 'high'> = ['low', 'normal'];
    
    for (const priority of priorities) {
      const keysToRemove: string[] = [];
      let freedBytes = 0;

      try {
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key) && key.startsWith('dlx-')) {
            try {
              const item = localStorage.getItem(key);
              if (item) {
                const entry = JSON.parse(item) as StorageEntry<unknown>;
                if (entry.priority === priority) {
                  keysToRemove.push(key);
                  freedBytes += key.length + item.length;
                  
                  if (freedBytes >= targetBytes) {
                    break;
                  }
                }
              }
            } catch {
              // Invalid entry, remove it
              keysToRemove.push(key);
            }
          }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        if (freedBytes >= targetBytes) {
          logger.info('Freed space in localStorage', { 
            freedBytes, 
            removedItems: keysToRemove.length,
            priority 
          });
          return true;
        }
      } catch (error) {
        logger.warn('Failed to free space', { 
          error: error instanceof Error ? error.message : String(error),
          priority 
        });
      }
    }

    return false;
  }

  /**
   * Store data with automatic quota management
   */
  async set<T>(key: string, data: T, options: StorageOptions = {}): Promise<boolean> {
    const {
      compress = false,
      expiresIn,
      priority = 'normal',
    } = options;

    const entry: StorageEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      priority,
      compressed: compress,
    };

    const fullKey = key.startsWith('dlx-') ? key : `dlx-${key}`;

    try {
      const serialized = JSON.stringify(entry);
      const usage = this.getLocalStorageUsage();

      // Check if we need to cleanup
      if (usage.percentage > this.QUOTA_WARNING_THRESHOLD) {
        logger.warn('localStorage approaching quota', { usage: `${(usage.percentage * 100).toFixed(1)}%` });
        this.cleanupExpired();
      }

      // Check if we need to free space
      if (usage.percentage > this.QUOTA_CRITICAL_THRESHOLD) {
        const needed = serialized.length * 2; // Request 2x the needed space
        await this.freeSpace(needed);
      }

      // Try localStorage first
      try {
        localStorage.setItem(fullKey, serialized);
        return true;
      } catch (error) {
        // Quota exceeded, try freeing space
        if (error instanceof Error && (
          error.name === 'QuotaExceededError' ||
          error.message.includes('quota') ||
          error.message.includes('exceeded')
        )) {
          logger.warn('localStorage quota exceeded, attempting to free space');
          
          // Try to free space equal to entry size
          await this.freeSpace(serialized.length * 2);
          
          // Retry
          try {
            localStorage.setItem(fullKey, serialized);
            return true;
          } catch {
            // If still failing, try IndexedDB
            if (this.db) {
              return await this.setIndexedDB(fullKey, entry);
            }
            throw error;
          }
        }
        throw error;
      }
    } catch (error) {
      logger.error('Failed to store data', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  /**
   * Get data from storage
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const fullKey = key.startsWith('dlx-') ? key : `dlx-${key}`;

    try {
      // Try localStorage first
      const item = localStorage.getItem(fullKey);
      
      if (item) {
        const entry = JSON.parse(item) as StorageEntry<T>;
        
        // Check expiration
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          localStorage.removeItem(fullKey);
          return defaultValue;
        }
        
        return entry.data;
      }

      // Try IndexedDB if available
      if (this.db) {
        const data = await this.getIndexedDB<T>(fullKey);
        if (data !== undefined) {
          return data;
        }
      }

      return defaultValue;
    } catch (error) {
      logger.error('Failed to retrieve data', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return defaultValue;
    }
  }

  /**
   * Remove data from storage
   */
  async remove(key: string): Promise<boolean> {
    const fullKey = key.startsWith('dlx-') ? key : `dlx-${key}`;

    try {
      localStorage.removeItem(fullKey);
      
      if (this.db) {
        await this.removeIndexedDB(fullKey);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to remove data', { 
        key: fullKey, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  /**
   * Clear all DLX storage
   */
  async clear(): Promise<boolean> {
    try {
      const keysToRemove: string[] = [];
      
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('dlx-')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (this.db) {
        const transaction = this.db.transaction(['storage'], 'readwrite');
        const objectStore = transaction.objectStore('storage');
        await new Promise<void>((resolve, reject) => {
          const request = objectStore.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      logger.info('Cleared all DLX storage', { removedKeys: keysToRemove.length });
      return true;
    } catch (error) {
      logger.error('Failed to clear storage', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    usage: { used: number; total: number; percentage: number };
    itemCount: number;
    indexedDBAvailable: boolean;
  } {
    const usage = this.getLocalStorageUsage();
    let itemCount = 0;
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('dlx-')) {
        itemCount++;
      }
    }
    
    return {
      usage,
      itemCount,
      indexedDBAvailable: this.db !== null,
    };
  }

  // IndexedDB helpers
  private async setIndexedDB<T>(key: string, entry: StorageEntry<T>): Promise<boolean> {
    if (!this.db) return false;

    try {
      const transaction = this.db.transaction(['storage'], 'readwrite');
      const objectStore = transaction.objectStore('storage');
      
      await new Promise<void>((resolve, reject) => {
        const request = objectStore.put({ key, ...entry });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      logger.info('Stored data in IndexedDB', { key });
      return true;
    } catch (error) {
      logger.error('IndexedDB put failed', { 
        key, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return false;
    }
  }

  private async getIndexedDB<T>(key: string): Promise<T | undefined> {
    if (!this.db) return undefined;

    try {
      const transaction = this.db.transaction(['storage'], 'readonly');
      const objectStore = transaction.objectStore('storage');
      
      const result = await new Promise<StorageEntry<T> | undefined>((resolve, reject) => {
        const request = objectStore.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      if (result) {
        // Check expiration
        if (result.expiresAt && result.expiresAt < Date.now()) {
          await this.removeIndexedDB(key);
          return undefined;
        }
        return result.data;
      }
      
      return undefined;
    } catch (error) {
      logger.error('IndexedDB get failed', { 
        key, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return undefined;
    }
  }

  private async removeIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction(['storage'], 'readwrite');
      const objectStore = transaction.objectStore('storage');
      
      await new Promise<void>((resolve, reject) => {
        const request = objectStore.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      logger.error('IndexedDB delete failed', { 
        key, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
}

export const storageService = new StorageService();

