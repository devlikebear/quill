/**
 * Navigation Generator - Generates navigation structures (GNB/LNB/Breadcrumbs)
 */

import type { PageInfo } from '../types/index.js';
import type { NavigationStructure, NavigationItem } from '../templates/types.js';
import { logger } from '../utils/logger.js';

/**
 * Navigation Generator
 */
export class NavigationGenerator {
  /**
   * Generate navigation structure from pages
   */
  generate(pages: PageInfo[], baseUrl: string): NavigationStructure {
    logger.info('Generating navigation structure...');

    // Build GNB (top-level pages)
    const gnb = this.buildGNB(pages, baseUrl);

    // Build LNB (all pages as flat list)
    const lnb = this.buildLNB(pages);

    // Build breadcrumbs (sample for homepage)
    const breadcrumbs = this.buildBreadcrumbs(baseUrl);

    const navigation: NavigationStructure = {
      gnb,
      lnb,
      breadcrumbs,
    };

    logger.info(`Navigation generated: ${gnb.length} GNB items, ${lnb.length} LNB items`);
    return navigation;
  }

  /**
   * Build Global Navigation Bar (top-level pages)
   */
  private buildGNB(pages: PageInfo[], baseUrl: string): NavigationItem[] {
    const gnbItems: NavigationItem[] = [];
    const topLevelPages = new Map<string, PageInfo[]>();

    // Group pages by top-level path
    for (const page of pages) {
      const topLevelPath = this.getTopLevelPath(page.url, baseUrl);
      if (!topLevelPages.has(topLevelPath)) {
        topLevelPages.set(topLevelPath, []);
      }
      topLevelPages.get(topLevelPath)!.push(page);
    }

    // Create GNB items
    for (const [path, groupPages] of topLevelPages) {
      // Find the main page (shortest URL in group)
      const mainPage = groupPages.reduce((shortest, current) =>
        current.url.length < shortest.url.length ? current : shortest
      );

      const children =
        groupPages.length > 1
          ? groupPages
              .filter((p) => p.url !== mainPage.url)
              .map((p) => ({
                title: p.title,
                url: p.url,
              }))
          : undefined;

      gnbItems.push({
        title: mainPage.title,
        url: mainPage.url,
        children,
      });
    }

    // Sort by URL
    return gnbItems.sort((a, b) => a.url.localeCompare(b.url));
  }

  /**
   * Build Local Navigation Bar (flat list of all pages)
   */
  private buildLNB(pages: PageInfo[]): NavigationItem[] {
    return pages
      .map((page) => ({
        title: page.title,
        url: page.url,
      }))
      .sort((a, b) => a.url.localeCompare(b.url));
  }

  /**
   * Build sample breadcrumbs for homepage
   */
  private buildBreadcrumbs(baseUrl: string): NavigationItem[] {
    return [
      {
        title: 'Home',
        url: baseUrl,
      },
    ];
  }

  /**
   * Get top-level path from URL
   */
  private getTopLevelPath(url: string, baseUrl: string): string {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(baseUrl);

      const urlPath = urlObj.pathname.replace(/^\/+|\/+$/g, '');
      const basePath = baseUrlObj.pathname.replace(/^\/+|\/+$/g, '');

      // Remove base path
      const relativePath = urlPath.startsWith(basePath)
        ? urlPath.slice(basePath.length).replace(/^\/+/, '')
        : urlPath;

      if (!relativePath) return '/';

      // Get first path segment
      const segments = relativePath.split('/').filter((s) => s.length > 0);
      return segments.length > 0 ? `/${segments[0]}` : '/';
    } catch {
      return '/';
    }
  }
}
