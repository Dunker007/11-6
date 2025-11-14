import type { LogLevel, LogEntry } from '@/types/logger';

type LogListener = (logEntry: LogEntry) => void;

const MAX_LOG_ENTRIES = 500;

class LoggerService {
  private static instance: LoggerService;
  private logEntries: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private isProduction = process.env.NODE_ENV === 'production';

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private addLog(level: LogLevel, message: string, context?: Record<string, any>) {
    // In production, we might only log warnings and errors
    if (this.isProduction && (level === 'info' || level === 'debug')) {
      return;
    }

    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      context,
    };

    this.logEntries.push(logEntry);

    // Trim old entries to prevent memory leaks
    if (this.logEntries.length > MAX_LOG_ENTRIES) {
      this.logEntries.shift();
    }

    // Pass structured log to the console
    this.consoleLog(logEntry);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(logEntry));
  }

  /**
   * Format context object into a readable string for inclusion in log messages
   */
  private formatContextForMessage(context: Record<string, any>): string {
    const parts: string[] = [];
    
    // Prioritize error messages
    if (context.error !== undefined) {
      const errorStr = typeof context.error === 'string' 
        ? context.error 
        : context.error instanceof Error 
          ? `${context.error.name}: ${context.error.message}`
          : String(context.error);
      parts.push(`error: ${errorStr}`);
    }
    
    // Add other context properties (excluding error which we already handled)
    for (const [key, value] of Object.entries(context)) {
      if (key === 'error') continue; // Already handled above
      
      let formattedValue: string;
      if (value === null || value === undefined) {
        formattedValue = String(value);
      } else if (typeof value === 'object') {
        // For objects, try to serialize meaningfully
        if (value instanceof Error) {
          formattedValue = `${value.name}: ${value.message}`;
        } else if (Array.isArray(value)) {
          formattedValue = `[${value.length} items]`;
        } else {
          // Try JSON.stringify, handle circular references
          try {
            const jsonStr = JSON.stringify(value);
            formattedValue = jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr;
          } catch (circularError) {
            // Circular reference detected
            formattedValue = '[Circular]';
          }
        }
      } else {
        formattedValue = String(value);
      }
      
      parts.push(`${key}: ${formattedValue}`);
    }
    
    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
  }

  private consoleLog(entry: LogEntry) {
    const { level, message, context } = entry;
    const style = `color: ${this.getColor(level)}; font-weight: bold;`;
    
    if (context) {
      // Format context into message string for better visibility
      const contextStr = this.formatContextForMessage(context);
      const fullMessage = message + contextStr;
      console[level](`%c[${level.toUpperCase()}]%c ${fullMessage}`, style, '');
    } else {
      console[level](`%c[${level.toUpperCase()}]%c ${message}`, style, '');
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '#9e9e9e'; // Grey
      case 'info': return '#2196f3';  // Blue
      case 'warn': return '#ff9800';  // Orange
      case 'error': return '#f44336'; // Red
      default: return '#ffffff';      // White
    }
  }

  public debug(message: string, context?: Record<string, any>) {
    this.addLog('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>) {
    this.addLog('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>) {
    this.addLog('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>) {
    this.addLog('error', message, context);
  }

  public getLogs(): LogEntry[] {
    return [...this.logEntries];
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const logger = LoggerService.getInstance();
