/**
 * HTML Formatter - Converts documents to HTML format
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Document, FormatterOptions, Section, TOCItem } from '../../types/index.js';
import { BaseFormatter } from './base.js';

/**
 * HTML formatter for generating web documents
 */
export class HtmlFormatter extends BaseFormatter {
  /**
   * Format document to HTML
   */
  format(document: Document, options: FormatterOptions = {}): string {
    return this.generateHtml(document, options);
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return 'html';
  }

  /**
   * Get MIME type
   */
  getMimeType(): string {
    return 'text/html';
  }

  /**
   * Generate complete HTML document
   */
  private generateHtml(document: Document, options: FormatterOptions): string {
    const head = this.renderHead(document);
    const styles = this.renderStyles();
    const toc =
      options.includeToc !== false && document.toc.items.length > 0
        ? this.renderTableOfContents(document.toc.items)
        : '';
    const sections = document.sections
      .map((section) => this.renderSection(section, options))
      .join('\n');

    return `<!DOCTYPE html>
<html lang="ko">
${head}
<body>
  ${toc ? `<nav class="sidebar">\n    ${toc}\n  </nav>` : ''}
  <main class="content ${toc ? '' : 'no-sidebar'}">
    <header class="doc-header">
      <h1>${this.escapeHtml(document.title)}</h1>
      <div class="metadata">
        <p><strong>Generated:</strong> ${this.formatDate(document.metadata.generatedAt)}</p>
        <p><strong>Base URL:</strong> <a href="${this.escapeHtml(document.metadata.baseUrl)}" target="_blank">${this.escapeHtml(document.metadata.baseUrl)}</a></p>
        <p><strong>Total Pages:</strong> ${document.metadata.pageCount}</p>
      </div>
    </header>
    <article>
      ${sections}
    </article>
  </main>
  <script>
    ${this.renderScript()}
  </script>
</body>
</html>`;
  }

  /**
   * Render HTML head section
   */
  private renderHead(document: Document): string {
    return `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(document.title)}</title>
  <style>
    ${this.renderStyles()}
  </style>
</head>`;
  }

  /**
   * Render CSS styles
   */
  private renderStyles(): string {
    return `
    /* Reset & Base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    /* Layout */
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      width: 280px;
      height: 100vh;
      background: #2c3e50;
      color: #ecf0f1;
      overflow-y: auto;
      padding: 2rem 1.5rem;
      z-index: 1000;
    }

    .sidebar h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #ecf0f1;
    }

    .content {
      margin-left: 280px;
      padding: 2rem;
      max-width: 1200px;
    }

    .content.no-sidebar {
      margin-left: auto;
      margin-right: auto;
    }

    /* Header */
    .doc-header {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .doc-header h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }

    .metadata {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .metadata p {
      margin: 0;
    }

    .metadata a {
      color: #3498db;
      text-decoration: none;
    }

    .metadata a:hover {
      text-decoration: underline;
    }

    /* Table of Contents */
    .toc {
      list-style: none;
    }

    .toc li {
      margin-bottom: 0.5rem;
    }

    .toc a {
      color: #ecf0f1;
      text-decoration: none;
      display: block;
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .toc a:hover {
      background: rgba(236, 240, 241, 0.1);
    }

    .toc .level-2 {
      padding-left: 1rem;
      font-size: 0.9rem;
    }

    .toc .level-3 {
      padding-left: 2rem;
      font-size: 0.85rem;
    }

    /* Sections */
    article {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .section {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #ecf0f1;
    }

    .section:last-child {
      border-bottom: none;
    }

    .section h2 {
      font-size: 2rem;
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .section-url {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-bottom: 1rem;
    }

    .section-url a {
      color: #3498db;
      text-decoration: none;
    }

    .section-url a:hover {
      text-decoration: underline;
    }

    .section-description {
      margin-bottom: 1.5rem;
      line-height: 1.8;
    }

    /* Screenshots */
    .screenshot {
      margin: 1.5rem 0;
      text-align: center;
    }

    .screenshot img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    /* UI Elements Table */
    .elements-section {
      margin-top: 2rem;
    }

    .elements-section h3 {
      font-size: 1.5rem;
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .elements-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    .elements-table th,
    .elements-table td {
      padding: 0.75rem;
      text-align: left;
      border: 1px solid #ddd;
    }

    .elements-table th {
      background: #34495e;
      color: white;
      font-weight: 600;
    }

    .elements-table tr:nth-child(even) {
      background: #f8f9fa;
    }

    .elements-table tr:hover {
      background: #e8f4f8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        height: auto;
        position: static;
        padding: 1rem;
      }

      .content {
        margin-left: 0;
        padding: 1rem;
      }

      .doc-header h1 {
        font-size: 1.8rem;
      }

      .metadata {
        flex-direction: column;
        gap: 0.5rem;
      }

      .section h2 {
        font-size: 1.5rem;
      }
    }

    /* Print Styles */
    @media print {
      .sidebar {
        display: none;
      }

      .content {
        margin-left: 0;
        max-width: 100%;
      }

      .section {
        page-break-inside: avoid;
      }

      .screenshot img {
        max-width: 100%;
        page-break-inside: avoid;
      }
    }

    /* Smooth Scroll */
    html {
      scroll-behavior: smooth;
    }
    `;
  }

  /**
   * Render table of contents
   */
  private renderTableOfContents(items: TOCItem[]): string {
    const renderItems = (tocItems: TOCItem[]): string => {
      return tocItems
        .map((item) => {
          const children =
            item.children && item.children.length > 0
              ? `\n      <ul class="toc">\n        ${renderItems(item.children)}\n      </ul>`
              : '';

          return `<li class="level-${item.depth}">
          <a href="#${this.escapeHtml(item.anchor)}">${this.escapeHtml(item.title)}</a>${children}
        </li>`;
        })
        .join('\n        ');
    };

    return `<h2>Table of Contents</h2>
    <ul class="toc">
      ${renderItems(items)}
    </ul>`;
  }

  /**
   * Render section
   */
  private renderSection(section: Section, options: FormatterOptions): string {
    const anchor = this.generateAnchor(section.title);
    let html = `<section class="section" id="${anchor}">
      <h2>${this.escapeHtml(section.title)}</h2>`;

    // URL
    if (section.url) {
      html += `
      <div class="section-url">
        <strong>URL:</strong> <a href="${this.escapeHtml(section.url)}" target="_blank">${this.escapeHtml(section.url)}</a>
      </div>`;
    }

    // Description
    if (section.description) {
      html += `
      <div class="section-description">
        ${this.escapeHtml(section.description)}
      </div>`;
    }

    // Screenshot
    if (options.includeScreenshots !== false && section.screenshot) {
      const imagePath = this.relativePath(section.screenshot);
      html += `
      <div class="screenshot">
        <img src="${this.escapeHtml(imagePath)}" alt="Screenshot of ${this.escapeHtml(section.title)}" loading="lazy">
      </div>`;
    }

    // UI Elements
    if (options.includeElements !== false && section.elements && section.elements.length > 0) {
      html += `
      <div class="elements-section">
        <h3>UI Elements</h3>
        ${this.renderElementsTable(section.elements)}
      </div>`;
    }

    html += `
    </section>`;

    return html;
  }

  /**
   * Render UI elements table
   */
  private renderElementsTable(elements: any[]): string {
    const rows = elements
      .map(
        (element) => `
        <tr>
          <td>${this.escapeHtml(element.type || '')}</td>
          <td>${this.escapeHtml(element.text || '')}</td>
          <td>${this.escapeHtml(element.description || '')}</td>
        </tr>`
      )
      .join('');

    return `
      <table class="elements-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Text</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>`;
  }

  /**
   * Render JavaScript for smooth scrolling
   */
  private renderScript(): string {
    return `
    // Smooth scroll with offset for fixed sidebar
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Active TOC link highlight
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          document.querySelectorAll('.toc a').forEach(link => {
            link.style.background = '';
          });
          const activeLink = document.querySelector(\`.toc a[href="#\${id}"]\`);
          if (activeLink) {
            activeLink.style.background = 'rgba(236, 240, 241, 0.2)';
          }
        }
      });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
      observer.observe(section);
    });
    `;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
  }

  /**
   * Convert absolute path to relative path
   */
  private relativePath(absolutePath: string): string {
    // If already relative, return as-is
    if (!path.isAbsolute(absolutePath)) {
      return absolutePath;
    }

    // Extract filename
    return path.basename(absolutePath);
  }
}
