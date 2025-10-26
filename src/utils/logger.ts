/**
 * Logger utility for Quill
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private level: LogLevel;
  private silent: boolean;

  constructor(level: LogLevel = 'info', silent = false) {
    this.level = level;
    this.silent = silent;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.silent) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs =
      args.length > 0 ? ' ' + args.map((arg) => JSON.stringify(arg)).join(' ') : '';

    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    console.log(chalk.gray(this.formatMessage('debug', message, ...args)));
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    console.log(chalk.blue(this.formatMessage('info', message, ...args)));
  }

  /**
   * Log success message
   */
  success(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    console.log(chalk.green(this.formatMessage('info', message, ...args)));
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    console.warn(chalk.yellow(this.formatMessage('warn', message, ...args)));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(this.formatMessage('error', message, errorMessage, ...args)));

    if (error instanceof Error && error.stack) {
      console.error(chalk.red(error.stack));
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Enable or disable logging
   */
  setSilent(silent: boolean): void {
    this.silent = silent;
  }
}

// Default logger instance
export const logger = new Logger('info');
