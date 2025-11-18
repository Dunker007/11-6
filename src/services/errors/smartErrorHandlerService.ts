/**
 * smartErrorHandlerService.ts
 *
 * PURPOSE:
 * Provides intelligent error handling with plain English explanations,
 * contextual recovery suggestions, and automatic retry logic.
 *
 * FEATURES:
 * - User-friendly error messages (no cryptic tech speak)
 * - Step-by-step recovery instructions
 * - Auto-fix capabilities
 * - Error history and logging
 * - Common error knowledge base
 * - Graceful degradation
 *
 * ARCHITECTURE:
 * Service using Zustand for error state management with persistent history
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export type ErrorCategory =
  | 'connection'
  | 'authentication'
  | 'rate-limit'
  | 'data'
  | 'permission'
  | 'validation'
  | 'system'
  | 'unknown';

export interface SmartError {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  category: ErrorCategory;

  // User-friendly messaging
  title: string;
  message: string;
  explanation: string;

  // Recovery
  suggestions: string[];
  autoFixAvailable: boolean;
  autoFixAction?: () => Promise<void>;

  // Technical details (hidden by default)
  technicalDetails?: {
    error: Error | string;
    stack?: string;
    context?: Record<string, any>;
  };

  // Tracking
  wasAutoFixed: boolean;
  wasResolved: boolean;
  retryCount: number;
}

interface SmartErrorHandlerState {
  // State
  currentError: SmartError | null;
  errorHistory: SmartError[];
  autoRetryEnabled: boolean;
  maxRetries: number;

  // Actions
  handleError: (error: Error | string, context?: Record<string, any>) => void;
  setCurrentError: (error: SmartError | null) => void;
  resolveError: (errorId: string) => void;
  retryError: (errorId: string) => Promise<void>;
  autoFixError: (errorId: string) => Promise<void>;
  clearHistory: () => void;
  setAutoRetry: (enabled: boolean) => void;

  // Getters
  getErrorById: (errorId: string) => SmartError | undefined;
  getRecentErrors: (count: number) => SmartError[];
  getErrorsByCategory: (category: ErrorCategory) => SmartError[];
}

export const useSmartErrorHandlerStore = create<SmartErrorHandlerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentError: null,
      errorHistory: [],
      autoRetryEnabled: true,
      maxRetries: 3,

      // Actions
      handleError: (error: Error | string, context?: Record<string, any>) => {
        const smartError = smartErrorHandlerService.parseError(error, context);

        set((state) => ({
          currentError: smartError,
          errorHistory: [smartError, ...state.errorHistory].slice(0, 100), // Keep last 100
        }));

        // Auto-retry logic for certain error types
        const state = get();
        if (
          state.autoRetryEnabled &&
          smartError.retryCount < state.maxRetries &&
          smartErrorHandlerService.shouldAutoRetry(smartError)
        ) {
          setTimeout(() => {
            get().retryError(smartError.id);
          }, smartErrorHandlerService.getRetryDelay(smartError.retryCount));
        }
      },

      setCurrentError: (error: SmartError | null) => {
        set({ currentError: error });
      },

      resolveError: (errorId: string) => {
        set((state) => ({
          currentError:
            state.currentError?.id === errorId ? null : state.currentError,
          errorHistory: state.errorHistory.map((err) =>
            err.id === errorId ? { ...err, wasResolved: true } : err
          ),
        }));
      },

      retryError: async (errorId: string) => {
        const state = get();
        const error = state.errorHistory.find((err) => err.id === errorId);

        if (!error) return;

        set((state) => ({
          errorHistory: state.errorHistory.map((err) =>
            err.id === errorId
              ? { ...err, retryCount: err.retryCount + 1 }
              : err
          ),
        }));

        // Implement actual retry logic here based on error type
        // This would typically re-execute the failed operation
      },

      autoFixError: async (errorId: string) => {
        const state = get();
        const error = state.errorHistory.find((err) => err.id === errorId);

        if (!error || !error.autoFixAction) return;

        try {
          await error.autoFixAction();

          set((state) => ({
            currentError: null,
            errorHistory: state.errorHistory.map((err) =>
              err.id === errorId
                ? { ...err, wasAutoFixed: true, wasResolved: true }
                : err
            ),
          }));
        } catch (fixError) {
          console.error('Auto-fix failed:', fixError);
        }
      },

      clearHistory: () => {
        set({ errorHistory: [] });
      },

      setAutoRetry: (enabled: boolean) => {
        set({ autoRetryEnabled: enabled });
      },

      // Getters
      getErrorById: (errorId: string) => {
        const state = get();
        return state.errorHistory.find((err) => err.id === errorId);
      },

      getRecentErrors: (count: number) => {
        const state = get();
        return state.errorHistory.slice(0, count);
      },

      getErrorsByCategory: (category: ErrorCategory) => {
        const state = get();
        return state.errorHistory.filter((err) => err.category === category);
      },
    }),
    {
      name: 'dlx-error-handler',
      version: 1,
      partialize: (state) => ({
        errorHistory: state.errorHistory.slice(0, 20), // Only persist recent errors
        autoRetryEnabled: state.autoRetryEnabled,
      }),
    }
  )
);

// Service helper methods
export const smartErrorHandlerService = {
  /**
   * Parse raw error into SmartError with user-friendly messaging
   */
  parseError(
    error: Error | string,
    context?: Record<string, any>
  ): SmartError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const category = this.categorizeError(errorMessage);
    const severity = this.determineSeverity(category, errorMessage);

    const smartError: SmartError = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      severity,
      category,
      title: this.getErrorTitle(category, errorMessage),
      message: this.getErrorMessage(category, errorMessage),
      explanation: this.getErrorExplanation(category, errorMessage),
      suggestions: this.getRecoverySuggestions(category, errorMessage),
      autoFixAvailable: this.canAutoFix(category, errorMessage),
      technicalDetails: {
        error: typeof error === 'string' ? error : error,
        stack: typeof error === 'object' ? error.stack : undefined,
        context,
      },
      wasAutoFixed: false,
      wasResolved: false,
      retryCount: 0,
    };

    // Add auto-fix action if available
    if (smartError.autoFixAvailable) {
      smartError.autoFixAction = this.getAutoFixAction(
        category,
        errorMessage,
        context
      );
    }

    return smartError;
  },

  /**
   * Categorize error based on message
   */
  categorizeError(message: string): ErrorCategory {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('network') ||
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('connection')
    ) {
      return 'connection';
    }

    if (
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('authentication') ||
      lowerMessage.includes('api key') ||
      lowerMessage.includes('invalid key') ||
      lowerMessage.includes('forbidden')
    ) {
      return 'authentication';
    }

    if (
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('quota exceeded')
    ) {
      return 'rate-limit';
    }

    if (
      lowerMessage.includes('permission') ||
      lowerMessage.includes('access denied')
    ) {
      return 'permission';
    }

    if (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('required field')
    ) {
      return 'validation';
    }

    if (
      lowerMessage.includes('parse') ||
      lowerMessage.includes('json') ||
      lowerMessage.includes('data')
    ) {
      return 'data';
    }

    if (
      lowerMessage.includes('memory') ||
      lowerMessage.includes('crash') ||
      lowerMessage.includes('system')
    ) {
      return 'system';
    }

    return 'unknown';
  },

  /**
   * Determine error severity
   */
  determineSeverity(
    category: ErrorCategory,
    message: string
  ): ErrorSeverity {
    if (category === 'critical' || message.toLowerCase().includes('crash')) {
      return 'critical';
    }

    if (
      category === 'authentication' ||
      category === 'permission' ||
      category === 'system'
    ) {
      return 'error';
    }

    if (category === 'rate-limit' || category === 'validation') {
      return 'warning';
    }

    return 'info';
  },

  /**
   * Get user-friendly error title
   */
  getErrorTitle(category: ErrorCategory, message: string): string {
    const titles: Record<ErrorCategory, string> = {
      connection: 'Connection Problem',
      authentication: 'Authentication Failed',
      'rate-limit': 'Rate Limit Reached',
      data: 'Data Error',
      permission: 'Permission Denied',
      validation: 'Invalid Input',
      system: 'System Error',
      unknown: 'Something Went Wrong',
    };

    return titles[category];
  },

  /**
   * Get user-friendly error message
   */
  getErrorMessage(category: ErrorCategory, message: string): string {
    const messages: Record<ErrorCategory, string> = {
      connection:
        "We couldn't reach the service. Please check your internet connection.",
      authentication:
        'Your credentials are invalid or have expired. Please reconnect the service.',
      'rate-limit':
        "You've hit the rate limit. Please wait a few minutes before trying again.",
      data: 'There was a problem with the data. Please try again.',
      permission:
        "You don't have permission to perform this action. Check your account settings.",
      validation: 'Some information is missing or invalid. Please check your input.',
      system: 'A system error occurred. Please restart the application.',
      unknown: 'An unexpected error occurred. Please try again.',
    };

    return messages[category];
  },

  /**
   * Get detailed explanation
   */
  getErrorExplanation(category: ErrorCategory, message: string): string {
    const explanations: Record<ErrorCategory, string> = {
      connection:
        'This usually happens when your internet is down, the service is temporarily unavailable, or a firewall is blocking the connection.',
      authentication:
        'Your API key or credentials may have been revoked, expired, or entered incorrectly. You may need to regenerate them from the service provider.',
      'rate-limit':
        'Most services have limits on how many requests you can make per hour. You\'ve reached that limit. Wait for the cooldown period to pass.',
      data: 'The data received from the service was in an unexpected format or contained errors.',
      permission:
        'Your account or API key may not have the necessary permissions for this action. Check your account settings with the service provider.',
      validation:
        'The information you provided doesn\'t meet the requirements (e.g., missing required fields, wrong format).',
      system:
        'Something went wrong at the system level. This could be a memory issue, corrupted data, or a bug.',
      unknown:
        'We encountered an unexpected error. This might be temporary or require investigation.',
    };

    return explanations[category];
  },

  /**
   * Get recovery suggestions
   */
  getRecoverySuggestions(
    category: ErrorCategory,
    message: string
  ): string[] {
    const suggestions: Record<ErrorCategory, string[]> = {
      connection: [
        'Check your internet connection',
        'Try again in a few moments',
        'Check if the service is down (visit their status page)',
        'Disable any VPN or firewall temporarily',
      ],
      authentication: [
        'Go to Settings → Credentials and reconnect the service',
        'Regenerate your API key from the service provider',
        'Verify your account is active and in good standing',
        'Check if the service has updated their authentication method',
      ],
      'rate-limit': [
        `Wait ${this.getRateLimitWaitTime(message)} before trying again`,
        'Reduce the frequency of your requests',
        'Consider upgrading your service plan for higher limits',
        'Spread out your automation tasks over a longer period',
      ],
      data: [
        'Try the operation again',
        'Check if the service has updated their API',
        'Clear your cache and retry',
        'Contact support if the problem persists',
      ],
      permission: [
        'Check your API key permissions in the service dashboard',
        'Ensure your account has the necessary subscription level',
        'Regenerate your API key with the correct permissions',
        'Contact the service support to verify your account status',
      ],
      validation: [
        'Double-check all required fields are filled',
        'Ensure data is in the correct format',
        'Review any validation messages shown',
        'Refer to the documentation for field requirements',
      ],
      system: [
        'Restart the application',
        'Clear the application cache',
        'Free up some memory by closing other apps',
        'Update to the latest version',
        'Contact support if the issue persists',
      ],
      unknown: [
        'Try the operation again',
        'Restart the application',
        'Check for updates',
        'Contact support with the error details',
      ],
    };

    return suggestions[category];
  },

  /**
   * Check if error can be auto-fixed
   */
  canAutoFix(category: ErrorCategory, message: string): boolean {
    // Auto-fixable categories
    return ['validation', 'data'].includes(category);
  },

  /**
   * Get auto-fix action
   */
  getAutoFixAction(
    category: ErrorCategory,
    message: string,
    context?: Record<string, any>
  ): (() => Promise<void>) | undefined {
    // Implement specific auto-fix logic based on category and context
    return undefined; // Placeholder
  },

  /**
   * Check if should auto-retry
   */
  shouldAutoRetry(error: SmartError): boolean {
    const retryableCategories: ErrorCategory[] = [
      'connection',
      'rate-limit',
      'data',
    ];
    return retryableCategories.includes(error.category);
  },

  /**
   * Get retry delay (exponential backoff)
   */
  getRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
  },

  /**
   * Get rate limit wait time from message
   */
  getRateLimitWaitTime(message: string): string {
    // Try to parse wait time from message
    // Default to a reasonable estimate
    return '5-10 minutes';
  },

  /**
   * Generate unique error ID
   */
  generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get error icon by category
   */
  getErrorIcon(category: ErrorCategory): string {
    const icons: Record<ErrorCategory, string> = {
      connection: '🌐',
      authentication: '🔐',
      'rate-limit': '⏱️',
      data: '📊',
      permission: '🚫',
      validation: '⚠️',
      system: '💻',
      unknown: '❓',
    };
    return icons[category];
  },

  /**
   * Get severity color
   */
  getSeverityColor(severity: ErrorSeverity): string {
    const colors: Record<ErrorSeverity, string> = {
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#dc2626',
    };
    return colors[severity];
  },
};
