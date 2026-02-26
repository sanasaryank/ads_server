/**
 * Centralized Logging Utility
 * Provides consistent logging across the application with level control
 */

import { env, isDevelopment } from '../config/env';

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  none: LogLevel.NONE,
};

/**
 * Get current log level from environment
 */
const getCurrentLogLevel = (): LogLevel => {
  return LOG_LEVEL_MAP[env.logLevel] ?? LogLevel.INFO;
};

/**
 * Check if log level should be displayed
 */
const shouldLog = (level: LogLevel): boolean => {
  return level >= getCurrentLogLevel();
};

/**
 * Format log message with timestamp and context
 */
const formatMessage = (level: string, message: string, context?: string): string => {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  return `${timestamp} [${level}] ${contextStr} ${message}`;
};

/**
 * Log error to external service (placeholder for future implementation)
 */
const sendToErrorService = (error: Error, context?: Record<string, unknown>): void => {
  // TODO: Implement error reporting service (e.g., Sentry, LogRocket)
  if (isDevelopment) {
    console.log('📤 Would send to error service:', { error, context });
  }
};

/**
 * Logger class with methods for different log levels
 */
class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Create a new logger with specific context
   */
  static withContext(context: string): Logger {
    return new Logger(context);
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: unknown): void {
    if (!shouldLog(LogLevel.DEBUG)) return;

    const formattedMessage = formatMessage('DEBUG', message, this.context);
    console.debug(formattedMessage, data ?? '');
  }

  /**
   * Info level logging
   */
  info(message: string, data?: unknown): void {
    if (!shouldLog(LogLevel.INFO)) return;

    const formattedMessage = formatMessage('INFO', message, this.context);
    console.info(formattedMessage, data ?? '');
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: unknown): void {
    if (!shouldLog(LogLevel.WARN)) return;

    const formattedMessage = formatMessage('WARN', message, this.context);
    console.warn(formattedMessage, data ?? '');
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (!shouldLog(LogLevel.ERROR)) return;

    const formattedMessage = formatMessage('ERROR', message, this.context);
    console.error(formattedMessage, error ?? '', context ?? '');

    // Send to error reporting service in production
    if (!isDevelopment && error instanceof Error) {
      sendToErrorService(error, {
        message,
        context: this.context,
        ...context,
      });
    }
  }

  /**
   * API request logging
   */
  api(method: string, url: string, status?: number, duration?: number): void {
    if (!shouldLog(LogLevel.DEBUG)) return;

    const statusEmoji = status && status >= 200 && status < 300 ? '✅' : '❌';
    const durationStr = duration ? `(${duration}ms)` : '';
    const message = `${statusEmoji} ${method} ${url} ${status ?? ''} ${durationStr}`;
    
    this.debug(message);
  }

  /**
   * Performance logging
   */
  perf(label: string, duration: number): void {
    if (!shouldLog(LogLevel.DEBUG)) return;

    const emoji = duration < 100 ? '⚡' : duration < 500 ? '⏱️' : '🐌';
    this.debug(`${emoji} ${label}: ${duration.toFixed(2)}ms`);
  }

  /**
   * User action logging
   */
  action(action: string, details?: Record<string, unknown>): void {
    if (!shouldLog(LogLevel.INFO)) return;

    this.info(`👤 User action: ${action}`, details);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create logger with specific context
 */
export const createLogger = (context: string): Logger => {
  return Logger.withContext(context);
};

/**
 * Performance measurement utility
 */
export class PerformanceMonitor {
  private startTime: number;
  private label: string;
  private logger: Logger;

  constructor(label: string, context?: string) {
    this.label = label;
    this.startTime = performance.now();
    this.logger = context ? Logger.withContext(context) : logger;
  }

  /**
   * End performance monitoring and log result
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    this.logger.perf(this.label, duration);
    return duration;
  }
}

/**
 * Measure performance of async function
 */
export const measureAsync = async <T>(
  label: string,
  fn: () => Promise<T>,
  context?: string,
): Promise<T> => {
  const monitor = new PerformanceMonitor(label, context);
  try {
    const result = await fn();
    monitor.end();
    return result;
  } catch (error) {
    monitor.end();
    throw error;
  }
};

/**
 * Measure performance of sync function
 */
export const measure = <T>(
  label: string,
  fn: () => T,
  context?: string,
): T => {
  const monitor = new PerformanceMonitor(label, context);
  try {
    const result = fn();
    monitor.end();
    return result;
  } catch (error) {
    monitor.end();
    throw error;
  }
};

export default logger;
