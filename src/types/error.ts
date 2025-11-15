/**
 * Error Capture System Types
 * Comprehensive type definitions for error logging and tracking
 */

export type ErrorCategory = 'react' | 'console' | 'network' | 'runtime' | 'build' | 'semantic-index' | 'semantic-search' | 'unknown';
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ErrorContext {
  // Application context
  activeWorkflow?: string;
  activeProject?: string;
  activeFile?: string;
  
  // User context
  recentActions?: string[]; // Last 5 activity descriptions
  sessionId?: string;
  
  // Environment context
  browser?: string;
  viewport?: { width: number; height: number };
  url?: string;
  
  // Component context (for React errors)
  componentStack?: string;
  
  // Network context
  requestUrl?: string;
  requestMethod?: string;
  statusCode?: number;
  
  // Additional metadata
  [key: string]: any;
}

export interface CapturedError {
  id: string;
  
  // Error identification
  type: ErrorCategory;
  severity: ErrorSeverity;
  
  // Error details
  message: string;
  stack?: string;
  name?: string;
  
  // Context
  context: ErrorContext;
  
  // Timing
  timestamp: number;
  
  // Deduplication
  fingerprint?: string; // Hash of message + stack for deduplication
  count?: number; // How many times this error occurred
  
  // State
  resolved?: boolean;
  notes?: string;
}

export interface ErrorPattern {
  id: string;
  pattern: RegExp | string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  suggestedFix?: string;
  autoFixable?: boolean;
  fixStrategy?: string;
  successRate?: number;
}

export interface ErrorStats {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  lastError?: CapturedError;
  sessionErrors: number;
}

export interface ErrorFilter {
  category?: ErrorCategory[];
  severity?: ErrorSeverity[];
  startTime?: number;
  endTime?: number;
  searchText?: string;
  resolved?: boolean;
}

