/**
 * Playwright Integration for Browser Automation
 *
 * Note: Currently using Playwright directly.
 * Future: Migrate to MCP server for better isolation.
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { AgentResult, PageInfo, UIElement } from '../types/index.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';

export interface PlaywrightOptions {
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
}

/**
 * Playwright integration for browser automation
 */
export class PlaywrightMCP {
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;
  private options: PlaywrightOptions;

  constructor(options: PlaywrightOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000,
      viewport: options.viewport ?? { width: 1920, height: 1080 },
    };
  }

  /**
   * Initialize browser instance
   */
  async init(): Promise<AgentResult<void>> {
    try {
      logger.info('Initializing Playwright browser...');

      this.browser = await chromium.launch({
        headless: this.options.headless,
      });

      this.context = await this.browser.newContext({
        viewport: this.options.viewport,
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });

      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(this.options.timeout!);

      logger.success('Playwright browser initialized successfully');

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to initialize Playwright browser', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize browser',
      };
    }
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<AgentResult<void>> {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized. Call init() first.');
      }

      logger.info(`Navigating to ${url}`);

      await this.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout,
      });

      logger.success(`Successfully navigated to ${url}`);

      return {
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to navigate to ${url}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to navigate',
      };
    }
  }

  /**
   * Take a screenshot of the current page
   */
  async screenshot(outputPath: string): Promise<AgentResult<string>> {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized. Call init() first.');
      }

      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });

      logger.info(`Taking screenshot: ${outputPath}`);

      await this.page.screenshot({
        path: outputPath,
        fullPage: true,
      });

      logger.success(`Screenshot saved: ${outputPath}`);

      return {
        success: true,
        data: outputPath,
      };
    } catch (error) {
      logger.error(`Failed to take screenshot: ${outputPath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to take screenshot',
      };
    }
  }

  /**
   * Extract links from the current page
   */
  async extractLinks(): Promise<AgentResult<string[]>> {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized. Call init() first.');
      }

      logger.debug('Extracting links from page');

      const currentUrl = this.page.url();

      const links = await this.page.$$eval('a[href]', (anchors, baseUrl) => {
        return anchors
          .map((a) => {
            const href = a.getAttribute('href');
            if (!href) return null;

            // Convert relative URLs to absolute
            try {
              return new URL(href, baseUrl).toString();
            } catch {
              return null;
            }
          })
          .filter((link): link is string => link !== null);
      }, currentUrl);

      // Remove duplicates
      const uniqueLinks = Array.from(new Set(links));

      logger.debug(`Extracted ${uniqueLinks.length} unique links`);

      return {
        success: true,
        data: uniqueLinks,
      };
    } catch (error) {
      logger.error('Failed to extract links', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract links',
      };
    }
  }

  /**
   * Get page information
   */
  async getPageInfo(): Promise<AgentResult<Partial<PageInfo>>> {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized. Call init() first.');
      }

      logger.debug('Getting page information');

      const url = this.page.url();

      const title = await this.page.title();

      const description = await this.page
        .$eval('meta[name="description"]', (el) => el.getAttribute('content'))
        .catch(() => null);

      logger.debug(`Page info: ${title}`);

      return {
        success: true,
        data: {
          url,
          title,
          description: description ?? undefined,
        },
      };
    } catch (error) {
      logger.error('Failed to get page information', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get page information',
      };
    }
  }

  /**
   * Extract UI elements from the page
   */
  async extractUIElements(): Promise<AgentResult<UIElement[]>> {
    try {
      if (!this.page) {
        throw new Error('Browser not initialized. Call init() first.');
      }

      logger.debug('Extracting UI elements');

      const elements: UIElement[] = [];

      // Extract buttons
      const buttons = await this.page.$$eval('button, [role="button"], input[type="button"], input[type="submit"]', (btns) =>
        btns.map((btn) => ({
          type: 'button' as const,
          label: btn.textContent?.trim() || btn.getAttribute('aria-label') || btn.getAttribute('title') || 'Button',
        }))
      );
      elements.push(...buttons);

      // Extract inputs
      const inputs = await this.page.$$eval('input:not([type="button"]):not([type="submit"]), textarea', (inputs) =>
        inputs.map((input) => ({
          type: 'input' as const,
          label: input.getAttribute('placeholder') || input.getAttribute('aria-label') || input.getAttribute('name') || 'Input',
        }))
      );
      elements.push(...inputs);

      // Extract links
      const links = await this.page.$$eval('a[href]', (anchors) =>
        anchors.slice(0, 20).map((a) => ({
          type: 'link' as const,
          label: a.textContent?.trim() || a.getAttribute('aria-label') || 'Link',
        }))
      );
      elements.push(...links);

      logger.debug(`Extracted ${elements.length} UI elements`);

      return {
        success: true,
        data: elements,
      };
    } catch (error) {
      logger.error('Failed to extract UI elements', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract UI elements',
      };
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<AgentResult<void>> {
    try {
      logger.info('Closing Playwright browser...');

      if (this.page) {
        await this.page.close();
        this.page = undefined;
      }

      if (this.context) {
        await this.context.close();
        this.context = undefined;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = undefined;
      }

      logger.success('Playwright browser closed successfully');

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to close Playwright browser', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close browser',
      };
    }
  }
}
