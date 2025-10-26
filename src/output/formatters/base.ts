/**
 * Base Formatter - Abstract formatter interface
 */

import type { Document, FormatterOptions } from '../../types/index.js';

/**
 * Base formatter interface for document generation
 */
export interface Formatter {
  /**
   * Format a document to string
   * @param document - Document to format
   * @param options - Formatting options
   * @returns Formatted document as string
   */
  format(document: Document, options?: FormatterOptions): string;

  /**
   * Get the file extension for this format
   */
  getExtension(): string;

  /**
   * Get the MIME type for this format
   */
  getMimeType(): string;
}

/**
 * Base formatter abstract class with common utilities
 */
export abstract class BaseFormatter implements Formatter {
  abstract format(document: Document, options?: FormatterOptions): string;
  abstract getExtension(): string;
  abstract getMimeType(): string;

  /**
   * Escape special characters for the target format
   */
  protected escapeText(text: string): string {
    return text;
  }

  /**
   * Generate a unique anchor ID from text
   */
  protected generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Format date for display
   */
  protected formatDate(date: string): string {
    try {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return date;
    }
  }

  /**
   * Truncate text to specified length
   */
  protected truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
