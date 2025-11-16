import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from './loggerService';

describe('LoggerService', () => {
  beforeEach(() => {
    // Clear logs before each test
    const logs = logger.getLogs();
    logs.forEach(() => {
      // Logs are stored internally, we can't clear them directly
      // But we can test that new logs are added
    });
  });

  describe('logging methods', () => {
    it('should log debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      logger.debug('Test debug message', { key: 'value' });
      
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.level).toBe('debug');
      expect(lastLog.message).toBe('Test debug message');
      expect(lastLog.context).toEqual({ key: 'value' });
      
      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      logger.info('Test info message');
      
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.level).toBe('info');
      expect(lastLog.message).toBe('Test info message');
      
      consoleSpy.mockRestore();
    });

    it('should log warn messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      logger.warn('Test warn message', { error: 'test error' });
      
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.level).toBe('warn');
      expect(lastLog.message).toBe('Test warn message');
      expect(lastLog.context).toEqual({ error: 'test error' });
      
      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const testError = new Error('Test error');
      logger.error('Test error message', { error: testError });
      
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.level).toBe('error');
      expect(lastLog.message).toBe('Test error message');
      expect(lastLog.context).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('log entry structure', () => {
    it('should create log entries with required fields', () => {
      logger.info('Test message');
      
      const logs = logger.getLogs();
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog).toHaveProperty('id');
      expect(lastLog).toHaveProperty('timestamp');
      expect(lastLog).toHaveProperty('level');
      expect(lastLog).toHaveProperty('message');
      expect(typeof lastLog.id).toBe('string');
      expect(lastLog.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers when logs are added', () => {
      const listener = vi.fn();
      const unsubscribe = logger.subscribe(listener);
      
      logger.info('Test message');
      
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0]).toMatchObject({
        level: 'info',
        message: 'Test message',
      });
      
      unsubscribe();
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = logger.subscribe(listener);
      
      logger.info('First message');
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      logger.info('Second message');
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('getLogs', () => {
    it('should return a copy of logs array', () => {
      logger.info('Test message 1');
      logger.info('Test message 2');
      
      const logs1 = logger.getLogs();
      const logs2 = logger.getLogs();
      
      // Should be different array instances
      expect(logs1).not.toBe(logs2);
      // But should have same content
      expect(logs1.length).toBe(logs2.length);
    });
  });

  describe('log limit', () => {
    it('should limit log entries to prevent memory leaks', () => {
      // Log more than MAX_LOG_ENTRIES (500)
      for (let i = 0; i < 600; i++) {
        logger.info(`Test message ${i}`);
      }
      
      const logs = logger.getLogs();
      // Should not exceed MAX_LOG_ENTRIES
      expect(logs.length).toBeLessThanOrEqual(500);
    });
  });
});

