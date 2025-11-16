import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleAsyncError,
  createErrorHandler,
  isErrorType,
  getErrorMessage,
  getErrorStack,
  createErrorBoundaryConfig,
} from './errorHandling';

// Mock dependencies
vi.mock('@/services/errors/errorLogger', () => ({
  errorLogger: {
    logFromError: vi.fn(),
  },
}));

vi.mock('@/services/logging/loggerService', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('errorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleAsyncError', () => {
    it('should return result from successful async function', async () => {
      const fn = async () => 'success';
      const wrapped = handleAsyncError(fn);
      
      const result = await wrapped();
      
      expect(result).toBe('success');
    });

    it('should return null on error by default', async () => {
      const fn = async () => {
        throw new Error('test error');
      };
      const wrapped = handleAsyncError(fn);
      
      const result = await wrapped();
      
      expect(result).toBeNull();
    });

    it('should call custom error handler on error', async () => {
      const fn = async () => {
        throw new Error('test error');
      };
      const onError = vi.fn();
      const wrapped = handleAsyncError(fn, { onError });
      
      await wrapped();
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error), {});
    });

    it('should log error when logError is true', async () => {
      const { errorLogger } = await import('@/services/errors/errorLogger');
      const fn = async () => {
        throw new Error('test error');
      };
      const wrapped = handleAsyncError(fn, { logError: true });
      
      await wrapped();
      
      expect(errorLogger.logFromError).toHaveBeenCalled();
    });

    it('should not log error when logError is false', async () => {
      const { errorLogger } = await import('@/services/errors/errorLogger');
      const fn = async () => {
        throw new Error('test error');
      };
      const wrapped = handleAsyncError(fn, { logError: false });
      
      await wrapped();
      
      expect(errorLogger.logFromError).not.toHaveBeenCalled();
    });

    it('should pass context to error handler', async () => {
      const fn = async () => {
        throw new Error('test error');
      };
      const onError = vi.fn();
      const context = { userId: '123', action: 'test' };
      const wrapped = handleAsyncError(fn, { onError, context });
      
      await wrapped();
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error), context);
    });
  });

  describe('createErrorHandler', () => {
    it('should create error handler that logs errors', () => {
      const handler = createErrorHandler('TestSource');
      const error = new Error('test error');
      
      handler(error);
      
      const { errorLogger } = require('@/services/errors/errorLogger');
      expect(errorLogger.logFromError).toHaveBeenCalledWith(
        'runtime',
        error,
        'error',
        expect.objectContaining({ source: 'TestSource' })
      );
    });

    it('should call custom handler if provided', () => {
      const customHandler = vi.fn();
      const handler = createErrorHandler('TestSource', customHandler);
      const error = new Error('test error');
      
      handler(error);
      
      expect(customHandler).toHaveBeenCalledWith(error, expect.objectContaining({ source: 'TestSource' }));
    });

    it('should merge context with source', () => {
      const handler = createErrorHandler('TestSource');
      const error = new Error('test error');
      const context = { userId: '123' };
      
      handler(error, context);
      
      const { errorLogger } = require('@/services/errors/errorLogger');
      expect(errorLogger.logFromError).toHaveBeenCalledWith(
        'runtime',
        error,
        'error',
        expect.objectContaining({ source: 'TestSource', userId: '123' })
      );
    });
  });

  describe('isErrorType', () => {
    it('should return true for matching error type', () => {
      const error = new TypeError('test');
      
      expect(isErrorType(error, 'TypeError')).toBe(true);
    });

    it('should return false for non-matching error type', () => {
      const error = new TypeError('test');
      
      expect(isErrorType(error, 'ReferenceError')).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isErrorType('not an error', 'TypeError')).toBe(false);
      expect(isErrorType(null, 'TypeError')).toBe(false);
      expect(isErrorType(undefined, 'TypeError')).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('test error');
      
      expect(getErrorMessage(error)).toBe('test error');
    });

    it('should return string as-is', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(null)).toBe('An error occurred');
      expect(getErrorMessage(undefined)).toBe('An error occurred');
      expect(getErrorMessage({})).toBe('An error occurred');
    });

    it('should use custom default message', () => {
      expect(getErrorMessage(null, 'Custom default')).toBe('Custom default');
    });

    it('should handle Error without message', () => {
      const error = new Error();
      error.message = '';
      
      expect(getErrorMessage(error)).toBe('An error occurred');
    });
  });

  describe('getErrorStack', () => {
    it('should extract stack from Error object', () => {
      const error = new Error('test error');
      
      expect(getErrorStack(error)).toBeTruthy();
      expect(typeof getErrorStack(error)).toBe('string');
    });

    it('should return undefined for non-Error values', () => {
      expect(getErrorStack('not an error')).toBeUndefined();
      expect(getErrorStack(null)).toBeUndefined();
      expect(getErrorStack(undefined)).toBeUndefined();
    });
  });

  describe('createErrorBoundaryConfig', () => {
    it('should create error boundary configuration', () => {
      const config = createErrorBoundaryConfig({
        source: 'TestComponent',
        fallbackMessage: 'Test error message',
      });
      
      expect(config.onError).toBeDefined();
      expect(config.fallback).toBeDefined();
    });

    it('should call error handler on error', () => {
      const onError = vi.fn();
      const config = createErrorBoundaryConfig({
        source: 'TestComponent',
        onError,
      });
      
      const error = new Error('test error');
      const info = { componentStack: 'at Component' };
      
      config.onError(error, info);
      
      expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({ componentStack: 'at Component' }));
    });

    it('should render fallback component', () => {
      const config = createErrorBoundaryConfig({
        source: 'TestComponent',
        fallbackMessage: 'Custom error message',
      });
      
      const Fallback = config.fallback;
      
      // This would normally be rendered by React, but we can check it's a function component
      expect(typeof Fallback).toBe('function');
    });
  });
});

