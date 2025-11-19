/**
 * Logger Service
 * Structured logging with levels and metadata
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata,
      source: this.getCallerSource(),
    };

    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };

    const color = {
      debug: '#888',
      info: '#00f0ff',
      warn: '#ffa500',
      error: '#ff0055',
    };

    console.log(
      `%c${emoji[level]} [${level.toUpperCase()}] ${message}`,
      `color: ${color[level]}; font-weight: bold`,
      metadata || ''
    );
  }

  private getCallerSource(): string {
    const error = new Error();
    const stack = error.stack?.split('\n')[4]; // Get 4th line (caller of log method)
    const match = stack?.match(/at\s+(.+?)\s+\(/);
    return match ? match[1] : 'unknown';
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log('error', message, metadata);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();

// Make available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
}
