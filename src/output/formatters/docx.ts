/**
 * DOCX Formatter - Converts documents to Word format
 */

import {
  Document as DocxDocument,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Document, FormatterOptions, Section } from '../../types/index.js';
import { BaseFormatter } from './base.js';

/**
 * DOCX formatter for generating Word documents
 */
export class DocxFormatter extends BaseFormatter {
  /**
   * Format document to DOCX
   */
  async format(document: Document, options: FormatterOptions = {}): Promise<Buffer> {
    const docxDocument = await this.createDocument(document, options);
    const buffer = await this.generateBuffer(docxDocument);
    return buffer;
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return 'docx';
  }

  /**
   * Get MIME type
   */
  getMimeType(): string {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  /**
   * Create DOCX document structure
   */
  private async createDocument(
    document: Document,
    options: FormatterOptions
  ): Promise<DocxDocument> {
    const children: Paragraph[] = [];

    // Cover page
    children.push(...this.createCoverPage(document));

    // Table of contents
    if (options.includeToc !== false && document.toc.items.length > 0) {
      children.push(
        new Paragraph({
          text: 'Table of Contents',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
      children.push(...this.createTableOfContents(document.toc.items));
      children.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        })
      );
    }

    // Sections
    for (const section of document.sections) {
      const sectionParagraphs = await this.createSection(section, options);
      children.push(...sectionParagraphs);
    }

    return new DocxDocument({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });
  }

  /**
   * Generate buffer from DOCX document
   */
  private async generateBuffer(doc: DocxDocument): Promise<Buffer> {
    const { Packer } = await import('docx');
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }

  /**
   * Create cover page
   */
  private createCoverPage(document: Document): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Title
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: document.title,
            bold: true,
            size: 48,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
      })
    );

    // Metadata
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${this.formatDate(document.metadata.generatedAt)}`,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Base URL: ${document.metadata.baseUrl}`,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Pages: ${document.metadata.pageCount}`,
            size: 22,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Page break
    paragraphs.push(
      new Paragraph({
        text: '',
        pageBreakBefore: true,
      })
    );

    return paragraphs;
  }

  /**
   * Create table of contents
   */
  private createTableOfContents(items: any[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    for (const item of items) {
      const indent = (item.level - 1) * 400;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: item.title,
            }),
          ],
          indent: { left: indent },
          spacing: { after: 100 },
        })
      );

      if (item.children && item.children.length > 0) {
        paragraphs.push(...this.createTableOfContents(item.children));
      }
    }

    return paragraphs;
  }

  /**
   * Create section
   */
  private async createSection(section: Section, options: FormatterOptions): Promise<Paragraph[]> {
    const paragraphs: Paragraph[] = [];

    // Section title
    paragraphs.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // URL
    if (section.url) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'URL: ',
              bold: true,
            }),
            new TextRun({
              text: section.url,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Description
    if (section.description) {
      paragraphs.push(
        new Paragraph({
          text: section.description,
          spacing: { after: 200 },
        })
      );
    }

    // Screenshot
    if (options.includeScreenshots !== false && section.screenshot) {
      try {
        const imageRun = await this.embedImage(section.screenshot);
        paragraphs.push(
          new Paragraph({
            children: [imageRun],
            spacing: { before: 200, after: 200 },
          })
        );
      } catch (error) {
        // Skip image if file not found
        console.warn(`Failed to embed image: ${section.screenshot}`);
      }
    }

    // UI Elements
    if (options.includeElements !== false && section.elements && section.elements.length > 0) {
      paragraphs.push(
        new Paragraph({
          text: 'UI Elements',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );

      const table = this.createElementsTable(section.elements);
      paragraphs.push(table as any); // Table is compatible with Paragraph[]
    }

    // Page break after section
    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { after: 400 },
      })
    );

    return paragraphs;
  }

  /**
   * Embed image from file path
   */
  private async embedImage(imagePath: string): Promise<ImageRun> {
    const imageBuffer = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();

    // Determine image dimensions (600px width, maintain aspect ratio)
    const width = 600;
    const height = 400; // Approximate, can be calculated from actual image

    return new ImageRun({
      data: imageBuffer,
      transformation: {
        width,
        height,
      },
      type: ext === '.png' ? 'png' : ext === '.jpg' || ext === '.jpeg' ? 'jpg' : 'png',
    });
  }

  /**
   * Create UI elements table
   */
  private createElementsTable(elements: any[]): Table {
    const rows: TableRow[] = [];

    // Header row
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Type',
                    bold: true,
                  }),
                ],
              }),
            ],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Text',
                    bold: true,
                  }),
                ],
              }),
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Description',
                    bold: true,
                  }),
                ],
              }),
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
        ],
      })
    );

    // Data rows
    for (const element of elements) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: element.type || '' })],
            }),
            new TableCell({
              children: [new Paragraph({ text: element.text || '' })],
            }),
            new TableCell({
              children: [new Paragraph({ text: element.description || '' })],
            }),
          ],
        })
      );
    }

    return new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
      },
    });
  }
}
