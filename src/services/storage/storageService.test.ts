import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storageService';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: mockIndexedDB,
});

// Mock logger
vi.mock('../logging/loggerService', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock IndexedDB open to return a successful request
    const mockRequest = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
        createObjectStore: vi.fn(),
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            get: vi.fn().mockReturnValue({
              onsuccess: null,
              onerror: null,
              result: null,
            }),
            put: vi.fn().mockReturnValue({
              onsuccess: null,
              onerror: null,
            }),
            delete: vi.fn().mockReturnValue({
              onsuccess: null,
              onerror: null,
            }),
          }),
        }),
      },
      error: null,
    };
    
    mockIndexedDB.open.mockReturnValue(mockRequest);
    
    // Simulate successful open
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: mockRequest } as any);
      }
    }, 0);
    
    storageService = new StorageService();
  });

  describe('set', () => {
    it('should store a value', async () => {
      await storageService.set('test-key', 'test-value');
      const value = await storageService.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should store complex objects', async () => {
      const testObject = { name: 'test', count: 42 };
      await storageService.set('test-object', testObject);
      const retrieved = await storageService.get('test-object');
      expect(retrieved).toEqual(testObject);
    });
  });

  describe('get', () => {
    it('should retrieve stored value', async () => {
      await storageService.set('test-key', 'test-value');
      const value = await storageService.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      const value = await storageService.get('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a stored value', async () => {
      await storageService.set('test-key', 'test-value');
      await storageService.remove('test-key');
      const value = await storageService.get('test-key');
      expect(value).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all stored values', async () => {
      await storageService.set('key1', 'value1');
      await storageService.set('key2', 'value2');
      await storageService.clear();
      
      const value1 = await storageService.get('key1');
      const value2 = await storageService.get('key2');
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('getUsage', () => {
    it('should return storage usage information', async () => {
      await storageService.set('test-key', 'test-value');
      const usage = await storageService.getUsage();
      
      expect(usage).toBeDefined();
      expect(usage.used).toBeGreaterThan(0);
      expect(usage.total).toBeGreaterThan(0);
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
    });
  });
});

