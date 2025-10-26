/**
 * Markdown Formatter - Converts documents to Markdown format
 */

import { BaseFormatter } from './base.js';
import type { Document, FormatterOptions, Section, TOCItem, UIElement } from '../../types/index.js';

/**
 * Markdown formatter implementation
 */
export class MarkdownFormatter extends BaseFormatter {
  /**
   * Format document to Markdown
   */
  format(document: Document, options?: FormatterOptions): string {
    const parts: string[] = [];

    // Title
    parts.push(`# ${this.escapeMarkdown(document.title)}\n`);

    // Metadata
    parts.push(this.formatMetadata(document));

    // Table of Contents
    if (options?.includeToc !== false) {
      parts.push(this.formatTOC(document.toc));
    }

    // Sections
    for (const section of document.sections) {
      parts.push(this.formatSection(section, options));
    }

    return parts.join('\n');
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return 'md';
  }

  /**
   * Get MIME type
   */
  getMimeType(): string {
    return 'text/markdown';
  }

  /**
   * Escape Markdown special characters
   * Only escape characters that actually break markdown rendering
   */
  protected escapeMarkdown(text: string): string {
    return text
      .replace(/\\/g, '\\\\')  // Backslash must be escaped
      .replace(/\*/g, '\\*')   // Asterisk for italic/bold
      .replace(/\_/g, '\\_')   // Underscore for italic/bold
      .replace(/\[/g, '\\[')   // Square brackets for links
      .replace(/\]/g, '\\]')
      .replace(/`/g, '\\`');   // Backticks for code
  }

  /**
   * Format metadata section
   */
  private formatMetadata(document: Document): string {
    const parts: string[] = [];

    parts.push('## Metadata\n');
    parts.push(`**Generated**: ${this.formatDate(document.metadata.generatedAt)}\n`);
    parts.push(`**Base URL**: ${document.metadata.baseUrl}\n`);
    parts.push(`**Total Pages**: ${document.metadata.pageCount}\n`);

    if (document.metadata.format) {
      parts.push(`**Format**: ${document.metadata.format}\n`);
    }

    if (document.metadata.version) {
      parts.push(`**Version**: ${document.metadata.version}\n`);
    }

    return parts.join('') + '\n';
  }

  /**
   * Format table of contents
   */
  private formatTOC(toc: { items: TOCItem[] }): string {
    const parts: string[] = [];

    parts.push('## Table of Contents\n');

    for (const item of toc.items) {
      parts.push(this.formatTOCItem(item));
    }

    return parts.join('') + '\n';
  }

  /**
   * Format a single TOC item
   */
  private formatTOCItem(item: TOCItem, level = 0): string {
    const indent = '  '.repeat(level);
    const line = `${indent}- [${this.escapeMarkdown(item.title)}](#${item.anchor})\n`;

    let result = line;

    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        result += this.formatTOCItem(child, level + 1);
      }
    }

    return result;
  }

  /**
   * Format a section
   */
  private formatSection(section: Section, options?: FormatterOptions): string {
    const parts: string[] = [];

    // Section divider
    parts.push('---\n');

    // Section title with anchor (use section.id for uniqueness)
    parts.push(`## ${this.escapeMarkdown(section.title)} {#${section.id}}\n`);

    // URL
    parts.push(`**URL**: ${section.url}\n`);

    // Description
    if (section.description) {
      parts.push(`\n${this.escapeMarkdown(section.description)}\n`);
    }

    // Screenshot
    if (options?.includeScreenshots !== false && section.screenshot) {
      parts.push(this.formatScreenshot(section));
    }

    // UI Elements
    if (options?.includeElements !== false && section.elements && section.elements.length > 0) {
      parts.push(this.formatUIElements(section.elements));
    }

    // Additional content
    if (section.content) {
      parts.push(`\n${section.content}\n`);
    }

    return parts.join('\n');
  }

  /**
   * Format screenshot section
   */
  private formatScreenshot(section: Section): string {
    if (!section.screenshot) {
      return '';
    }

    const parts: string[] = [];
    parts.push('\n### Screenshot\n');

    // Use relative path for the image
    const imagePath = section.screenshot;
    const altText = this.escapeMarkdown(section.title);

    parts.push(`![${altText}](${imagePath})\n`);

    return parts.join('');
  }

  /**
   * Format UI elements section
   */
  private formatUIElements(elements: UIElement[]): string {
    const parts: string[] = [];

    parts.push('\n### UI Elements\n');

    for (const element of elements) {
      const type = element.type;
      const text = this.escapeMarkdown(element.text);

      parts.push(`- **${type}**: ${text}\n`);

      if (element.description) {
        parts.push(`  - ${this.escapeMarkdown(element.description)}\n`);
      }

      if (element.selector) {
        parts.push(`  - Selector: \`${element.selector}\`\n`);
      }
    }

    return parts.join('');
  }
}
