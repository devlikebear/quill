/**
 * Main Agent - Orchestrates the documentation generation workflow
 */

import type { QuillConfig, AgentResult, PageInfo, Document } from '../types/index.js';
import { PlaywrightMCP } from '../mcp/playwright.js';
import { WebCrawlerAgent } from './subagents/web-crawler.js';
import { DocumentGenerator } from './subagents/document-generator.js';
import { logger } from '../utils/logger.js';

/**
 * Main orchestrator agent for Quill documentation generation
 */
export class MainAgent {
  private config: QuillConfig;
  private playwright: PlaywrightMCP;
  private crawler?: WebCrawlerAgent;
  private documentGenerator?: DocumentGenerator;

  constructor(config: QuillConfig) {
    this.config = config;
    this.playwright = new PlaywrightMCP({
      headless: true,
      timeout: 30000,
    });
    this.documentGenerator = new DocumentGenerator({
      title: `${new URL(config.url).hostname} Documentation`,
      includeDescriptions: true,
      includeElements: true,
    });
  }

  /**
   * Execute the documentation generation workflow
   */
  async execute(): Promise<AgentResult<PageInfo[]>> {
    try {
      logger.info('Starting documentation generation workflow...');

      // 1. Initialize Playwright browser
      const initResult = await this.playwright.init();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // 2. Create web crawler agent
      this.crawler = new WebCrawlerAgent(this.playwright, {
        maxDepth: this.config.depth ?? 2,
        maxPages: this.config.options?.maxPages ?? 50,
        outputDir: this.config.output ?? './output/screenshots',
      });

      // 3. Crawl pages
      const crawlResult = await this.crawler.crawl(this.config.url);
      if (!crawlResult.success || !crawlResult.data) {
        throw new Error(crawlResult.error || 'Crawl failed');
      }

      const pages = crawlResult.data;

      logger.success(`Documentation generation complete. Collected ${pages.length} pages.`);

      return {
        success: true,
        data: pages,
        metadata: {
          config: this.config,
          pageCount: pages.length,
        },
      };
    } catch (error) {
      logger.error('Documentation generation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      // Always close browser
      await this.playwright.close();
    }
  }

  /**
   * Get collected pages
   */
  getPages(): PageInfo[] {
    return this.crawler?.getResults() ?? [];
  }

  /**
   * Generate document from collected pages
   */
  generateDocument(pages: PageInfo[]): AgentResult<Document> {
    if (!this.documentGenerator) {
      return {
        success: false,
        error: 'Document generator not initialized',
      };
    }

    return this.documentGenerator.generate(pages);
  }
}
