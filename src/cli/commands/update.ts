/**
 * Update Command - Partial update of documentation for specific pages
 */

import chalk from 'chalk';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { MainAgent } from '../../agent/main-agent.js';
import { generateMultiFile } from '../../generators/multi-file-generator.js';
import type { QuillConfig, PageInfo } from '../../types/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Update command options
 */
interface UpdateOptions {
  page?: string;
  url?: string;
  outputDir?: string;
  template?: string;
}

/**
 * Update command handler
 */
export async function updateCommand(options: UpdateOptions): Promise<void> {
  try {
    console.log(chalk.blue('🔄 Quill Update - Partial Documentation Update\n'));

    // Validate required options
    if (!options.page) {
      throw new Error('--page option is required. Specify the page URL to update.');
    }

    if (!options.outputDir) {
      throw new Error('--output-dir option is required. Specify the documentation directory.');
    }

    if (!existsSync(options.outputDir)) {
      throw new Error(`Output directory does not exist: ${options.outputDir}`);
    }

    logger.info(`Updating page: ${options.page}`);
    logger.info(`Output directory: ${options.outputDir}`);

    // Find base URL from existing documentation
    const baseUrl = options.url || (await findBaseUrl(options.outputDir));
    if (!baseUrl) {
      throw new Error('Could not determine base URL. Please provide --url option.');
    }

    logger.info(`Base URL: ${baseUrl}`);

    // Load existing pages from documentation
    const existingPages = await loadExistingPages(options.outputDir);
    logger.info(`Found ${existingPages.length} existing pages`);

    // Crawl the specific page
    logger.info(`Crawling updated page: ${options.page}`);
    const config: QuillConfig = {
      url: options.page,
      depth: 1, // Only crawl the specific page
      format: 'markdown',
      output: options.outputDir,
    };

    const agent = new MainAgent(config);
    const result = await agent.execute();

    if (!result.success || !result.data || result.data.length === 0) {
      throw new Error('Failed to crawl the specified page');
    }

    const updatedPage = result.data[0];
    if (!updatedPage) {
      throw new Error('No page data returned from crawler');
    }

    logger.success(`Successfully crawled: ${updatedPage.title}`);

    // Merge updated page with existing pages
    const mergedPages = mergePages(existingPages, updatedPage);
    logger.info(`Total pages after update: ${mergedPages.length}`);

    // Regenerate documentation with updated pages
    logger.info('Regenerating documentation...');
    const generationResult = await generateMultiFile(mergedPages, {
      template: options.template || 'user-guide',
      outputDir: options.outputDir,
      baseUrl,
    });

    console.log(chalk.green('\n✅ Update complete!'));
    console.log(chalk.gray(`Files updated: ${generationResult.filesGenerated}`));
    console.log(chalk.gray(`Output directory: ${generationResult.outputDir}`));
  } catch (error) {
    console.error(chalk.red('\n❌ Update failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Find base URL from existing documentation metadata
 */
async function findBaseUrl(outputDir: string): Promise<string | null> {
  try {
    // Try to find index file with metadata
    const indexFiles = ['index.md', 'README.md', 'sitemap.md'];

    for (const fileName of indexFiles) {
      const filePath = join(outputDir, fileName);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');

        // Extract base URL from content
        const baseUrlMatch = content.match(/Base URL[:\s]+(.+)/i);
        if (baseUrlMatch && baseUrlMatch[1]) {
          return baseUrlMatch[1].trim();
        }

        // Extract from markdown links
        const linkMatch = content.match(/\[.*?\]\((https?:\/\/[^)]+)\)/);
        if (linkMatch && linkMatch[1]) {
          const url = new URL(linkMatch[1]);
          return `${url.protocol}//${url.host}`;
        }
      }
    }

    return null;
  } catch (error) {
    logger.warn('Could not determine base URL from existing documentation');
    return null;
  }
}

/**
 * Load existing pages from documentation directory
 */
async function loadExistingPages(outputDir: string): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];

  try {
    const pagesDir = join(outputDir, 'pages');
    if (!existsSync(pagesDir)) {
      logger.warn('No pages directory found');
      return pages;
    }

    // Read all page directories
    const entries = readdirSync(pagesDir);

    for (const entry of entries) {
      const entryPath = join(pagesDir, entry);
      const stat = statSync(entryPath);

      if (stat.isDirectory()) {
        // Try to load page overview
        const overviewPath = join(entryPath, 'overview.md');
        if (existsSync(overviewPath)) {
          const content = readFileSync(overviewPath, 'utf-8');
          const page = parsePageFromMarkdown(content, entry);
          if (page) {
            pages.push(page);
          }
        }
      }
    }

    return pages;
  } catch (error) {
    logger.error('Failed to load existing pages', error);
    return [];
  }
}

/**
 * Parse PageInfo from markdown content
 */
function parsePageFromMarkdown(content: string, pageId: string): PageInfo | null {
  try {
    // Extract title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch && titleMatch[1] ? titleMatch[1] : pageId;

    // Extract URL
    const urlMatch = content.match(/\*\*URL\*\*:\s*(.+)$/m);
    const url = urlMatch && urlMatch[1] ? urlMatch[1].trim() : '';

    // Extract description
    const descMatch = content.match(/##\s+Description\s+(.+?)(?=\n##|\n$)/s);
    const description = descMatch && descMatch[1] ? descMatch[1].trim() : '';

    if (!url) {
      return null;
    }

    return {
      url,
      title,
      description,
      elements: [], // Will be repopulated on update
    };
  } catch (error) {
    logger.warn(`Failed to parse page: ${pageId}`);
    return null;
  }
}

/**
 * Merge updated page with existing pages
 */
function mergePages(existingPages: PageInfo[], updatedPage: PageInfo): PageInfo[] {
  // Find and replace the updated page
  const existingIndex = existingPages.findIndex((p) => p.url === updatedPage.url);

  if (existingIndex >= 0) {
    // Replace existing page
    const merged = [...existingPages];
    merged[existingIndex] = updatedPage;
    logger.info(`Replaced existing page: ${updatedPage.url}`);
    return merged;
  } else {
    // Add new page
    logger.info(`Added new page: ${updatedPage.url}`);
    return [...existingPages, updatedPage];
  }
}
