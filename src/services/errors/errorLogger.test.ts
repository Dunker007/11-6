import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorLogger } from './errorLogger';
import type { ErrorCategory, ErrorSeverity } from '@/types/error';

// Mock dependencies
vi.mock('./errorContext', () => ({
  errorContext: {
    getContext: vi.fn().mockReturnValue({}),
  },
}));

vi.mock('../logging/loggerService', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ErrorLogger', () => {
  let errorLogger: ErrorLogger;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Get fresh instance
    errorLogger = ErrorLogger.getInstance();
    // Clear errors
    const errors = errorLogger.getErrors();
    errors.forEach(error => {
      // Note: ErrorLogger doesn't have a clear method, so we'll work with what we have
    });
  });

  describe('logError', () => {
    it('should log an error with all required fields', () => {
      const error = errorLogger.logError('runtime', 'Test error', 'error');
      
      expect(error).toBeDefined();
      expect(error.id).toBeDefined();
      expect(error.type).toBe('runtime');
      expect(error.message).toBe('Test error');
      expect(error.severity).toBe('error');
      expect(error.timestamp).toBeDefined();
      expect(error.context).toBeDefined();
    });

    it('should include additional context', () => {
      const error = errorLogger.logError(
        'network',
        'Network error',
        'error',
        { requestUrl: 'https://example.com' }
      );
      
      expect(error.context.requestUrl).toBe('https://example.com');
    });

    it('should deduplicate recent duplicate errors', () => {
      const error1 = errorLogger.logError('runtime', 'Duplicate error', 'error');
      const error2 = errorLogger.logError('runtime', 'Duplicate error', 'error');
      
      // Should increment count instead of creating new error
      expect(error2.count).toBeGreaterThan(1);
    });
  });

  describe('logFromError', () => {
    it('should log from an Error object', () => {
      const testError = new Error('Test error message');
      testError.stack = 'Error stack trace';
      
      const logged = errorLogger.logFromError('runtime', testError);
      
      expect(logged.message).toBe('Test error message');
      expect(logged.context.stack).toBe('Error stack trace');
      expect(logged.context.name).toBe('Error');
    });
  });

  describe('getErrors', () => {
    it('should return all logged errors', () => {
      errorLogger.logError('runtime', 'Error 1', 'error');
      errorLogger.logError('network', 'Error 2', 'warning');
      
      const errors = errorLogger.getErrors();
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getFilteredErrors', () => {
    it('should filter errors by category', () => {
      errorLogger.logError('runtime', 'Runtime error', 'error');
      errorLogger.logError('network', 'Network error', 'error');
      
      const filtered = errorLogger.getFilteredErrors({ category: ['runtime'] });
      expect(filtered.every(e => e.type === 'runtime')).toBe(true);
    });

    it('should filter errors by severity', () => {
      errorLogger.logError('runtime', 'Error', 'error');
      errorLogger.logError('runtime', 'Warning', 'warning');
      
      const filtered = errorLogger.getFilteredErrors({ severity: ['error'] });
      expect(filtered.every(e => e.severity === 'error')).toBe(true);
    });

    it('should filter errors by search text', () => {
      errorLogger.logError('runtime', 'Database connection failed', 'error');
      errorLogger.logError('runtime', 'File not found', 'error');
      
      const filtered = errorLogger.getFilteredErrors({ searchText: 'Database' });
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].message).toContain('Database');
    });
  });

  describe('getStats', () => {
    it('should return error statistics', () => {
      errorLogger.logError('runtime', 'Error 1', 'error');
      errorLogger.logError('network', 'Error 2', 'warning');
      
      const stats = errorLogger.getStats();
      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byCategory).toBeDefined();
    });
  });
});

