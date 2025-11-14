/**
 * errorLogger.ts
 * 
 * PURPOSE:
 * Centralized error logging and tracking service. Captures, stores, and manages application
 * errors with context, deduplication, and persistence. Provides error analytics and filtering
 * capabilities for debugging and monitoring.
 * 
 * ARCHITECTURE:
 * Singleton service that:
 * - Captures errors with full context (stack, session, component, etc.)
 * - Deduplicates similar errors within time window
 * - Persists errors to localStorage
 * - Provides error filtering and statistics
 * - Supports error listeners for real-time notifications
 * - Generates error fingerprints for grouping
 * 
 * CURRENT STATUS:
 * ✅ Error capture with context
 * ✅ Error deduplication
 * ✅ LocalStorage persistence
 * ✅ Error filtering and search
 * ✅ Error statistics
 * ✅ Error listeners/subscriptions
 * ✅ Session tracking
 * ✅ Error fingerprinting
 * 
 * DEPENDENCIES:
 * - errorContext: Application context capture
 * - @/types/error: Error type definitions
 * 
 * STATE MANAGEMENT:
 * - Singleton pattern (no Zustand)
 * - Maintains errors array in memory
 * - Persists to localStorage
 * - Manages error listeners
 * 
 * PERFORMANCE:
 * - Efficient deduplication
 * - Limited error storage (max 500 errors)
 * - Fast filtering and search
 * - Minimal memory footprint
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { errorLogger } from '@/services/errors/errorLogger';
 * 
 * try {
 *   // operation
 * } catch (error) {
 *   errorLogger.logFromError(error, {
 *     category: 'ai',
 *     source: 'ComponentName',
 *   });
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/errors/errorContext.ts: Context capture
 * - src/components/ErrorConsole/ErrorConsole.tsx: Error display UI
 * - src/App.tsx: Error boundary integration
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Error reporting to external services
 * - Error auto-repair suggestions
 * - Error trend analysis
 * - Error grouping by fingerprint
 */
import { CapturedError, ErrorCategory, ErrorSeverity, ErrorContext, ErrorFilter, ErrorStats } from '../../types/error';
import { errorContext } from './errorContext';
import { getUserFacingMessage, getRecoveryChecklist } from './errorMessages';
import { logger } from '../logging/loggerService';

type ErrorListener = (error: CapturedError) => void;

class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: CapturedError[] = [];
  private listeners: Set<ErrorListener> = new Set();
  private sessionId: string;
  private readonly STORAGE_KEY = 'dlx-errors';
  private readonly MAX_ERRORS = 500; // Keep last 500 errors
  private readonly DEDUP_WINDOW = 5000; // 5 seconds for deduplication
  private storageDisabled = false; // Disable localStorage on quota errors

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadErrors();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log a new error
   */
  logError(
    category: ErrorCategory,
    message: string,
    severity: ErrorSeverity = 'error',
    additionalContext?: Partial<ErrorContext>
  ): CapturedError {
    // Capture current application context
    const capturedContext = errorContext.getContext();

    const error: CapturedError = {
      id: this.generateErrorId(),
      type: category,
      severity,
      message,
      timestamp: Date.now(),
      context: {
        sessionId: this.sessionId,
        ...capturedContext,
        ...additionalContext, // Override with specific context if provided
      },
      fingerprint: this.generateFingerprint(message, additionalContext?.stack),
      count: 1,
    };

    // Check for duplicate recent errors
    const duplicate = this.findRecentDuplicate(error);
    if (duplicate) {
      duplicate.count = (duplicate.count || 1) + 1;
      duplicate.timestamp = Date.now(); // Update timestamp
      this.notifyListeners(duplicate);
      this.saveErrors();
      return duplicate;
    }

    // Add new error
    this.errors.unshift(error); // Add to beginning (most recent first)
    
    // Maintain max size
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors = this.errors.slice(0, this.MAX_ERRORS);
    }

    this.saveErrors();
    this.notifyListeners(error);
    
    // Also log to console for debugging
    this.logToConsole(error);
    
    return error;
  }

  /**
   * Log from an Error object
   */
  logFromError(
    category: ErrorCategory,
    error: Error,
    severity: ErrorSeverity = 'error',
    additionalContext?: Partial<ErrorContext>
  ): CapturedError {
    return this.logError(category, error.message, severity, {
      stack: error.stack,
      name: error.name,
      ...additionalContext,
    });
  }

  /**
   * Get all errors
   */
  getErrors(): CapturedError[] {
    return [...this.errors];
  }

  /**
   * Get filtered errors
   */
  getFilteredErrors(filter: ErrorFilter): CapturedError[] {
    return this.errors.filter(error => {
      if (filter.category && !filter.category.includes(error.type)) return false;
      if (filter.severity && !filter.severity.includes(error.severity)) return false;
      if (filter.startTime && error.timestamp < filter.startTime) return false;
      if (filter.endTime && error.timestamp > filter.endTime) return false;
      if (filter.resolved !== undefined && error.resolved !== filter.resolved) return false;
      if (filter.searchText) {
        const search = filter.searchText.toLowerCase();
        if (!error.message.toLowerCase().includes(search) &&
            !error.stack?.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    const stats: ErrorStats = {
      total: this.errors.length,
      bySeverity: {
        critical: 0,
        error: 0,
        warning: 0,
        info: 0,
      },
      byCategory: {
        react: 0,
        console: 0,
        network: 0,
        runtime: 0,
        build: 0,
        unknown: 0,
      },
      sessionErrors: 0,
    };

    this.errors.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.type]++;
      if (error.context.sessionId === this.sessionId) {
        stats.sessionErrors++;
      }
    });

    if (this.errors.length > 0) {
      stats.lastError = this.errors[0];
    }

    return stats;
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string, notes?: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.notes = notes;
      this.saveErrors();
      return true;
    }
    return false;
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    this.saveErrors();
  }

  /**
   * Clear errors older than specified age (in milliseconds)
   */
  clearOldErrors(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const originalLength = this.errors.length;
    this.errors = this.errors.filter(error => error.timestamp >= cutoff);
    const removed = originalLength - this.errors.length;
    if (removed > 0) {
      this.saveErrors();
    }
    return removed;
  }

  /**
   * Export errors to JSON
   */
  exportErrors(filter?: ErrorFilter): string {
    const errors = filter ? this.getFilteredErrors(filter) : this.errors;
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      sessionId: this.sessionId,
      errorCount: errors.length,
      errors,
    }, null, 2);
  }

  /**
   * Subscribe to error events
   */
  subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Provide a human-friendly summary for the error.
   */
  getUserFriendlyMessage(error: CapturedError): string {
    return getUserFacingMessage(error);
  }

  /**
   * Provide suggested recovery actions for the error.
   */
  getRecoverySteps(error: CapturedError): string[] {
    return getRecoveryChecklist(error);
  }

  // Private methods

  private findRecentDuplicate(error: CapturedError): CapturedError | undefined {
    const recentWindow = Date.now() - this.DEDUP_WINDOW;
    return this.errors.find(
      e => e.fingerprint === error.fingerprint && 
           e.timestamp >= recentWindow &&
           !e.resolved
    );
  }

  private generateFingerprint(message: string, stack?: string): string {
    const content = `${message}${stack || ''}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Removed unused getBrowserInfo method

  private saveErrors(): void {
    // Skip if localStorage is disabled
    if (this.storageDisabled) {
      return;
    }

    try {
      // Remove heavy data before saving
      const lightweight = this.errors.map(({ stack, context, ...rest }) => ({
        ...rest,
        stack: stack?.substring(0, 500), // Truncate stack traces
        context: {
          sessionId: context.sessionId,
          activeWorkflow: context.activeWorkflow,
          activeProject: context.activeProject,
          activeFile: context.activeFile,
          url: context.url,
          // Omit heavy context data
        },
      }));
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lightweight));
    } catch (error) {
      // Disable future localStorage attempts
      this.storageDisabled = true;
      
      // Use original console to avoid recursion
      const originalError = (console as any).__originalError;
      if (originalError) {
        originalError('ErrorLogger: localStorage disabled due to quota error:', error);
      }
    }
  }

  private loadErrors(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.errors = JSON.parse(stored);
        // Clear old errors on load (7 days)
        this.clearOldErrors();
      }
    } catch (error) {
      logger.error('Failed to load errors from localStorage', { error });
      this.errors = [];
    }
  }

  private notifyListeners(error: CapturedError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        logger.error('Error in error listener', { error: err });
      }
    });
  }

  private logToConsole(error: CapturedError): void {
    // Style definitions for console logging (currently not used but kept for future)
    /* const style = {
      critical: 'background: #dc2626; color: white; font-weight: bold;',
      error: 'background: #ef4444; color: white;',
      warning: 'background: #f59e0b; color: white;',
      info: 'background: #3b82f6; color: white;',
    }; */

    logger.error(`[${error.severity.toUpperCase()}] ${error.type}`, {
      severity: error.severity,
      type: error.type,
      message: error.message,
      id: error.id,
      timestamp: error.timestamp,
      context: error.context,
    });
  }
}

export const errorLogger = ErrorLogger.getInstance();

