/**
 * Document Generator Agent - Converts page data into structured documents
 */

import type {
  PageInfo,
  Document,
  Section,
  TOC,
  TOCItem,
  DocumentMetadata,
  AgentResult,
} from '../../types/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Options for document generation
 */
export interface DocumentGeneratorOptions {
  /** Document title (defaults to base URL) */
  title?: string;
  /** Include page descriptions */
  includeDescriptions?: boolean;
  /** Include UI elements */
  includeElements?: boolean;
  /** Maximum TOC depth */
  maxTocDepth?: number;
}

/**
 * Document Generator Agent
 */
export class DocumentGenerator {
  private options: Required<DocumentGeneratorOptions>;

  constructor(options: DocumentGeneratorOptions = {}) {
    this.options = {
      title: options.title ?? 'Web Application Documentation',
      includeDescriptions: options.includeDescriptions ?? true,
      includeElements: options.includeElements ?? true,
      maxTocDepth: options.maxTocDepth ?? 3,
    };
  }

  /**
   * Generate a structured document from page information
   */
  generate(pages: PageInfo[]): AgentResult<Document> {
    try {
      logger.info('Generating document from page data...');

      if (!pages || pages.length === 0) {
        throw new Error('No pages to generate document from');
      }

      const document: Document = {
        title: this.options.title,
        metadata: this.buildMetadata(pages),
        toc: this.buildTOC(pages),
        sections: this.buildSections(pages),
      };

      logger.success(`Document generated with ${pages.length} sections`);

      return {
        success: true,
        data: document,
        metadata: {
          pageCount: pages.length,
          sectionCount: document.sections.length,
        },
      };
    } catch (error) {
      logger.error('Failed to generate document', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build document metadata
   */
  private buildMetadata(pages: PageInfo[]): DocumentMetadata {
    const baseUrl = pages[0]?.url ?? '';
    const urlObj = new URL(baseUrl);

    return {
      generatedAt: new Date().toISOString(),
      baseUrl: `${urlObj.protocol}//${urlObj.host}`,
      pageCount: pages.length,
      version: '0.3.0',
    };
  }

  /**
   * Build table of contents from pages
   */
  private buildTOC(pages: PageInfo[]): TOC {
    const items: TOCItem[] = pages.map((page, index) => ({
      title: page.title || `Page ${index + 1}`,
      anchor: `section-${index + 1}`,  // Match section.id for unique anchors
      depth: 1,
    }));

    return { items };
  }

  /**
   * Build sections from pages
   */
  private buildSections(pages: PageInfo[]): Section[] {
    return pages.map((page, index) => this.buildSection(page, index));
  }

  /**
   * Build a single section from page info
   */
  private buildSection(page: PageInfo, index: number): Section {
    const section: Section = {
      id: `section-${index + 1}`,
      title: page.title || `Page ${index + 1}`,
      url: page.url,
    };

    // Add description if enabled
    if (this.options.includeDescriptions && page.description) {
      section.description = page.description;
    }

    // Add screenshot path if available
    if (page.screenshot) {
      section.screenshot = page.screenshot;
    }

    // Add UI elements if enabled
    if (this.options.includeElements && page.elements && page.elements.length > 0) {
      section.elements = page.elements;
    }

    return section;
  }

  /**
   * Set document title
   */
  setTitle(title: string): void {
    this.options.title = title;
  }

  /**
   * Get current options
   */
  getOptions(): DocumentGeneratorOptions {
    return { ...this.options };
  }
}
