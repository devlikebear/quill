/**
 * Sitemap Generator - Generates site structure from pages
 */

import type { PageInfo } from '../types/index.js';
import type { SitemapStructure, SitemapPage } from '../templates/types.js';
import { logger } from '../utils/logger.js';

/**
 * Sitemap Generator
 */
export class SitemapGenerator {
  /**
   * Generate sitemap structure from pages
   */
  generate(pages: PageInfo[], baseUrl: string): SitemapStructure {
    logger.info('Generating sitemap structure...');

    // Sort pages by URL depth and path
    const sortedPages = this.sortPages(pages, baseUrl);

    // Build hierarchical sitemap
    const sitemapPages: SitemapPage[] = sortedPages.map((page) => ({
      id: this.generatePageId(page.url),
      url: page.url,
      title: page.title,
      description: page.description || '',
      level: this.calculateLevel(page.url, baseUrl),
    }));

    // Build hierarchy
    const hierarchy = this.buildHierarchy(sitemapPages);

    const sitemap: SitemapStructure = {
      pages: sitemapPages,
      hierarchy,
    };

    logger.info(`Sitemap generated: ${sitemapPages.length} pages`);
    return sitemap;
  }

  /**
   * Sort pages by depth and alphabetically
   */
  private sortPages(pages: PageInfo[], baseUrl: string): PageInfo[] {
    return [...pages].sort((a, b) => {
      const levelA = this.calculateLevel(a.url, baseUrl);
      const levelB = this.calculateLevel(b.url, baseUrl);

      // Sort by level first
      if (levelA !== levelB) {
        return levelA - levelB;
      }

      // Then alphabetically by URL
      return a.url.localeCompare(b.url);
    });
  }

  /**
   * Calculate page level from URL
   */
  private calculateLevel(url: string, baseUrl: string): number {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(baseUrl);

      const urlPath = urlObj.pathname.replace(/^\/+|\/+$/g, '');
      const basePath = baseUrlObj.pathname.replace(/^\/+|\/+$/g, '');

      // Remove base path
      const relativePath = urlPath.startsWith(basePath)
        ? urlPath.slice(basePath.length).replace(/^\/+/, '')
        : urlPath;

      if (!relativePath) return 1;

      const segments = relativePath.split('/').filter((s) => s.length > 0);
      return Math.min(segments.length + 1, 6);
    } catch {
      return 1;
    }
  }

  /**
   * Build hierarchical structure
   */
  private buildHierarchy(pages: SitemapPage[]): Record<string, SitemapPage[]> {
    const hierarchy: Record<string, SitemapPage[]> = {};

    // Group pages by level
    for (const page of pages) {
      const level = `level${page.level}`;
      if (!hierarchy[level]) {
        hierarchy[level] = [];
      }
      hierarchy[level].push(page);
    }

    return hierarchy;
  }

  /**
   * Generate page ID from URL
   */
  private generatePageId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      const id = pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase();

      return id || 'index';
    } catch {
      return url
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase()
        .slice(0, 50);
    }
  }
}
