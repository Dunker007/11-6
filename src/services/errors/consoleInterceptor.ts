import { errorLogger } from './errorLogger';

/**
 * Console Error Interceptor
 * Captures console.error and console.warn calls while preserving original behavior
 */

class ConsoleInterceptor {
  private static instance: ConsoleInterceptor;
  private originalError: typeof console.error;
  private originalWarn: typeof console.warn;
  private isActive = false;
  private isProcessing = false; // Recursion guard

  // Patterns to ignore (noisy errors that don't need logging)
  private ignorePatterns: RegExp[] = [
    /Download the React DevTools/i,
    /React Router Future Flag Warning/i,
  ];

  private constructor() {
    this.originalError = console.error.bind(console);
    this.originalWarn = console.warn.bind(console);
    
    // Expose original methods globally for emergency use (prevent infinite loops)
    (console as any).__originalError = this.originalError;
    (console as any).__originalWarn = this.originalWarn;
  }

  static getInstance(): ConsoleInterceptor {
    if (!ConsoleInterceptor.instance) {
      ConsoleInterceptor.instance = new ConsoleInterceptor();
    }
    return ConsoleInterceptor.instance;
  }

  /**
   * Start intercepting console errors and warnings
   */
  activate(): void {
    if (this.isActive) return;

    console.error = (...args: any[]) => {
      this.handleConsoleError(args);
      this.originalError(...args);
    };

    console.warn = (...args: any[]) => {
      this.handleConsoleWarn(args);
      this.originalWarn(...args);
    };

    this.isActive = true;
  }

  /**
   * Stop intercepting (restore original console methods)
   */
  deactivate(): void {
    if (!this.isActive) return;

    console.error = this.originalError;
    console.warn = this.originalWarn;
    
    this.isActive = false;
  }

  /**
   * Add a pattern to ignore
   */
  addIgnorePattern(pattern: RegExp): void {
    this.ignorePatterns.push(pattern);
  }

  /**
   * Remove an ignore pattern
   */
  removeIgnorePattern(pattern: RegExp): void {
    this.ignorePatterns = this.ignorePatterns.filter(p => p.source !== pattern.source);
  }

  private handleConsoleError(args: any[]): void {
    // Prevent infinite recursion - if already processing, bail out
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const message = this.formatMessage(args);
      
      // Check if should be ignored
      if (this.shouldIgnore(message)) return;

      // Extract stack trace if Error object is passed
      let stack: string | undefined;
      const errorObj = args.find(arg => arg instanceof Error);
      if (errorObj) {
        stack = errorObj.stack;
      }

      errorLogger.logError('console', message, 'error', { stack });
    } finally {
      this.isProcessing = false;
    }
  }

  private handleConsoleWarn(args: any[]): void {
    // Prevent infinite recursion - if already processing, bail out
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const message = this.formatMessage(args);
      
      // Check if should be ignored
      if (this.shouldIgnore(message)) return;

      errorLogger.logError('console', message, 'warning');
    } finally {
      this.isProcessing = false;
    }
  }

  private formatMessage(args: any[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');
  }

  private shouldIgnore(message: string): boolean {
    return this.ignorePatterns.some(pattern => pattern.test(message));
  }
}

export const consoleInterceptor = ConsoleInterceptor.getInstance();

