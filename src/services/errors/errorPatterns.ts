import { ErrorPattern } from '../../types/error';

/**
 * Error Pattern Database
 * Stores error patterns and their fix strategies
 */

export interface ErrorFixResult {
  success: boolean;
  message: string;
}

class ErrorPatternDatabase {
  private static instance: ErrorPatternDatabase;
  private patterns: Map<string, ErrorPattern> = new Map();
  private fixHistory: Map<string, number[]> = new Map(); // pattern ID -> success count per attempt

  private constructor() {
    this.initializePatterns();
  }

  static getInstance(): ErrorPatternDatabase {
    if (!ErrorPatternDatabase.instance) {
      ErrorPatternDatabase.instance = new ErrorPatternDatabase();
    }
    return ErrorPatternDatabase.instance;
  }

  /**
   * Initialize error patterns with fix strategies
   */
  private initializePatterns(): void {
    const patterns: ErrorPattern[] = [
      {
        id: 'storage-quota-exceeded',
        pattern: /QuotaExceededError/i,
        category: 'runtime',
        severity: 'critical',
        suggestedFix: 'Clear old localStorage data to free up space',
        autoFixable: true,
        fixStrategy: 'clearOldActivities',
        successRate: 0.95,
      },
      {
        id: 'api-key-missing',
        pattern: /API key.*missing/i,
        category: 'network',
        severity: 'critical',
        suggestedFix: 'Add API key in Settings',
        autoFixable: false,
      },
      {
        id: 'llm-not-running',
        pattern: /LM Studio.*not running/i,
        category: 'network',
        severity: 'error',
        suggestedFix: 'Start LM Studio or configure alternative LLM',
        autoFixable: false,
      },
      {
        id: 'monaco-disposed',
        pattern: /model.*disposed/i,
        category: 'runtime',
        severity: 'warning',
        suggestedFix: 'Reload the editor',
        autoFixable: true,
        fixStrategy: 'reloadEditor',
        successRate: 0.80,
      },
    ];

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  /**
   * Get a pattern by ID
   */
  getPattern(id: string): ErrorPattern | undefined {
    return this.patterns.get(id);
  }

  /**
   * Find matching pattern for an error message
   */
  findPattern(message: string): ErrorPattern | undefined {
    for (const pattern of this.patterns.values()) {
      const matches = typeof pattern.pattern === 'string'
        ? message.includes(pattern.pattern)
        : pattern.pattern.test(message);

      if (matches) {
        return pattern;
      }
    }
    return undefined;
  }

  /**
   * Record fix attempt result
   */
  recordFixAttempt(patternId: string, success: boolean): void {
    const history = this.fixHistory.get(patternId) || [];
    history.push(success ? 1 : 0);
    
    // Keep only last 100 attempts
    if (history.length > 100) {
      history.shift();
    }
    
    this.fixHistory.set(patternId, history);

    // Update success rate
    const pattern = this.patterns.get(patternId);
    if (pattern) {
      const successCount = history.reduce((sum, val) => sum + val, 0);
      pattern.successRate = successCount / history.length;
    }
  }

  /**
   * Get fix history for a pattern
   */
  getFixHistory(patternId: string): { attempts: number; successRate: number } {
    const history = this.fixHistory.get(patternId) || [];
    const successCount = history.reduce((sum, val) => sum + val, 0);
    return {
      attempts: history.length,
      successRate: history.length > 0 ? successCount / history.length : 0,
    };
  }

  /**
   * Add or update a pattern
   */
  addPattern(pattern: ErrorPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values());
  }
}

export const errorPatternDB = ErrorPatternDatabase.getInstance();

