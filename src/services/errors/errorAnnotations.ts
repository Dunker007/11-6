import { ErrorPattern, CapturedError, ErrorSeverity } from '../../types/error';

/**
 * Error Annotations Service
 * Pattern matching for common errors with suggested fixes
 */

class ErrorAnnotations {
  private static instance: ErrorAnnotations;
  private patterns: ErrorPattern[] = [];

  private constructor() {
    this.initializePatterns();
  }

  static getInstance(): ErrorAnnotations {
    if (!ErrorAnnotations.instance) {
      ErrorAnnotations.instance = new ErrorAnnotations();
    }
    return ErrorAnnotations.instance;
  }

  /**
   * Initialize common error patterns
   */
  private initializePatterns(): void {
    this.patterns = [
      // React errors
      {
        id: 'react-invalid-element',
        pattern: /Element type is invalid/i,
        category: 'react',
        severity: 'error',
        suggestedFix: 'Check your component imports. Ensure you\'re using named vs default imports correctly.',
        autoFixable: false,
      },
      {
        id: 'react-hook-rules',
        pattern: /Hooks can only be called inside/i,
        category: 'react',
        severity: 'error',
        suggestedFix: 'Move hooks to the top level of your component. Don\'t call them inside loops, conditions, or nested functions.',
        autoFixable: false,
      },
      {
        id: 'react-key-prop',
        pattern: /Each child in a list should have a unique "key" prop/i,
        category: 'react',
        severity: 'warning',
        suggestedFix: 'Add a unique key prop to each item when mapping arrays. Use stable IDs instead of array indexes.',
        autoFixable: false,
      },

      // Network errors
      {
        id: 'network-failed',
        pattern: /Failed to fetch|Network request failed/i,
        category: 'network',
        severity: 'error',
        suggestedFix: 'Check your network connection and ensure the API endpoint is reachable.',
        autoFixable: false,
      },
      {
        id: 'api-key-missing',
        pattern: /API key.*(?:missing|required|not found)/i,
        category: 'network',
        severity: 'critical',
        suggestedFix: 'Configure your API key in Settings > API Keys',
        autoFixable: false,
      },
      {
        id: 'cors-error',
        pattern: /CORS|Cross-Origin/i,
        category: 'network',
        severity: 'error',
        suggestedFix: 'CORS policy is blocking the request. Check server CORS configuration or use a proxy.',
        autoFixable: false,
      },

      // Runtime errors
      {
        id: 'undefined-property',
        pattern: /Cannot read propert(?:y|ies) of undefined/i,
        category: 'runtime',
        severity: 'error',
        suggestedFix: 'Check if the object exists before accessing its properties. Use optional chaining (?.) or null checks.',
        autoFixable: false,
      },
      {
        id: 'null-reference',
        pattern: /Cannot read propert(?:y|ies) of null/i,
        category: 'runtime',
        severity: 'error',
        suggestedFix: 'Add null checks before accessing properties. Consider using optional chaining (?.).',
        autoFixable: false,
      },
      {
        id: 'function-not-defined',
        pattern: /(\w+) is not a function/i,
        category: 'runtime',
        severity: 'error',
        suggestedFix: 'Ensure the function is defined and imported correctly. Check for typos in function names.',
        autoFixable: false,
      },
      {
        id: 'undefined-variable',
        pattern: /(\w+) is not defined/i,
        category: 'runtime',
        severity: 'error',
        suggestedFix: 'Define the variable or import it from the correct module.',
        autoFixable: false,
      },

      // Console warnings
      {
        id: 'deprecated-api',
        pattern: /deprecated/i,
        category: 'console',
        severity: 'warning',
        suggestedFix: 'This API is deprecated. Check the documentation for the recommended alternative.',
        autoFixable: false,
      },
      {
        id: 'memory-leak',
        pattern: /memory leak|cleanup|subscription/i,
        category: 'console',
        severity: 'warning',
        suggestedFix: 'Add cleanup functions to useEffect hooks. Unsubscribe from subscriptions and clear intervals/timeouts.',
        autoFixable: false,
      },

      // Monaco/Editor errors
      {
        id: 'monaco-model-disposed',
        pattern: /model.*disposed/i,
        category: 'runtime',
        severity: 'warning',
        suggestedFix: 'The Monaco editor model was disposed. Ensure proper lifecycle management.',
        autoFixable: false,
      },

      // localStorage errors
      {
        id: 'storage-quota',
        pattern: /QuotaExceededError|storage.*full/i,
        category: 'runtime',
        severity: 'critical',
        suggestedFix: 'localStorage is full. Clear old data or reduce the amount of data being stored.',
        autoFixable: true,
        fixStrategy: 'clearOldLocalStorage',
      },

      // LLM/AI errors
      {
        id: 'llm-connection',
        pattern: /LM Studio|Ollama.*(?:not running|unavailable|connection)/i,
        category: 'network',
        severity: 'error',
        suggestedFix: 'Start LM Studio or Ollama, or configure a cloud LLM provider in Settings.',
        autoFixable: false,
      },

      // Build errors
      {
        id: 'import-not-found',
        pattern: /Cannot find module|Module not found/i,
        category: 'build',
        severity: 'error',
        suggestedFix: 'Install the missing module with npm/yarn or check the import path.',
        autoFixable: false,
      },
      {
        id: 'typescript-error',
        pattern: /TS\d{4}/,
        category: 'build',
        severity: 'error',
        suggestedFix: 'TypeScript error. Check the type definitions and ensure type compatibility.',
        autoFixable: false,
      },
    ];
  }

  /**
   * Annotate an error with suggested fixes
   */
  annotate(error: CapturedError): CapturedError & { suggestedFix?: string; autoFixable?: boolean; fixStrategy?: string } {
    for (const pattern of this.patterns) {
      const matches = typeof pattern.pattern === 'string' 
        ? error.message.includes(pattern.pattern)
        : pattern.pattern.test(error.message);

      if (matches) {
        return {
          ...error,
          suggestedFix: pattern.suggestedFix,
          autoFixable: pattern.autoFixable,
          fixStrategy: pattern.fixStrategy,
        };
      }
    }

    return error;
  }

  /**
   * Add a custom error pattern
   */
  addPattern(pattern: ErrorPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Get all patterns
   */
  getPatterns(): ErrorPattern[] {
    return [...this.patterns];
  }

  /**
   * Classify error severity based on pattern matching
   */
  classifySeverity(message: string): ErrorSeverity | null {
    for (const pattern of this.patterns) {
      const matches = typeof pattern.pattern === 'string'
        ? message.includes(pattern.pattern)
        : pattern.pattern.test(message);

      if (matches) {
        return pattern.severity;
      }
    }
    return null;
  }
}

export const errorAnnotations = ErrorAnnotations.getInstance();

