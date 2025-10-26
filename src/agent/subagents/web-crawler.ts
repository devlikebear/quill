/**
 * Web Crawler Agent - BFS-based page crawling
 */

import type { PageInfo, AgentResult } from '../../types/index.js';
import { PlaywrightMCP } from '../../mcp/playwright.js';
import { logger } from '../../utils/logger.js';
import {
  normalizeUrl,
  isSameDomain,
  filterSameDomainUrls,
  urlToFilename,
} from '../../utils/url-utils.js';
import path from 'path';

export interface CrawlerOptions {
  maxDepth?: number;
  maxPages?: number;
  outputDir?: string;
}

interface QueueItem {
  url: string;
  depth: number;
}

/**
 * Web crawler agent using BFS algorithm
 */
export class WebCrawlerAgent {
  private playwright: PlaywrightMCP;
  private options: Required<CrawlerOptions>;
  private visited: Set<string>;
  private queue: QueueItem[];
  private results: PageInfo[];

  constructor(playwright: PlaywrightMCP, options: CrawlerOptions = {}) {
    this.playwright = playwright;
    this.options = {
      maxDepth: options.maxDepth ?? 2,
      maxPages: options.maxPages ?? 50,
      outputDir: options.outputDir ?? './output/screenshots',
    };
    this.visited = new Set();
    this.queue = [];
    this.results = [];
  }

  /**
   * Start crawling from a URL
   */
  async crawl(startUrl: string): Promise<AgentResult<PageInfo[]>> {
    try {
      logger.info(`Starting crawl from: ${startUrl}`);
      logger.info(`Max depth: ${this.options.maxDepth}, Max pages: ${this.options.maxPages}`);

      // Initialize queue with start URL
      this.queue.push({ url: normalizeUrl(startUrl), depth: 0 });

      while (this.queue.length > 0 && this.results.length < this.options.maxPages) {
        const item = this.queue.shift();
        if (!item) break;

        const { url, depth } = item;

        // Skip if already visited or depth exceeded
        if (this.visited.has(url) || depth > this.options.maxDepth) {
          continue;
        }

        // Crawl this page
        const result = await this.crawlPage(url, depth, startUrl);

        if (result.success && result.data) {
          this.results.push(result.data);
          this.visited.add(url);

          logger.success(`Crawled (${this.results.length}/${this.options.maxPages}): ${url}`);

          // Add links to queue if not at max depth
          if (depth < this.options.maxDepth && result.data.links) {
            const sameDomainLinks = filterSameDomainUrls(result.data.links, startUrl);

            for (const link of sameDomainLinks) {
              const normalizedLink = normalizeUrl(link);
              if (!this.visited.has(normalizedLink)) {
                this.queue.push({ url: normalizedLink, depth: depth + 1 });
              }
            }
          }
        }
      }

      logger.success(`Crawl complete. Visited ${this.results.length} pages.`);

      return {
        success: true,
        data: this.results,
      };
    } catch (error) {
      logger.error('Crawl failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(
    url: string,
    depth: number,
    baseUrl: string
  ): Promise<AgentResult<PageInfo>> {
    try {
      // Navigate to page
      const navResult = await this.playwright.navigate(url);
      if (!navResult.success) {
        throw new Error(navResult.error);
      }

      // Get page info
      const infoResult = await this.playwright.getPageInfo();
      if (!infoResult.success || !infoResult.data) {
        throw new Error(infoResult.error || 'Failed to get page info');
      }

      // Extract links
      const linksResult = await this.playwright.extractLinks();
      const links = linksResult.success ? linksResult.data : [];

      // Extract UI elements
      const elementsResult = await this.playwright.extractUIElements();
      const elements = elementsResult.success ? elementsResult.data : [];

      // Take screenshot
      const screenshotFilename = urlToFilename(url);
      const screenshotPath = path.join(this.options.outputDir, screenshotFilename);

      await this.playwright.screenshot(screenshotPath);

      const pageInfo: PageInfo = {
        url: infoResult.data.url!,
        title: infoResult.data.title!,
        description: infoResult.data.description,
        screenshot: screenshotPath,
        links,
        elements,
      };

      return {
        success: true,
        data: pageInfo,
      };
    } catch (error) {
      logger.error(`Failed to crawl page: ${url}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get crawl results
   */
  getResults(): PageInfo[] {
    return this.results;
  }

  /**
   * Reset crawler state
   */
  reset(): void {
    this.visited.clear();
    this.queue = [];
    this.results = [];
  }
}
