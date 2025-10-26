/**
 * Multi-file Generation Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { generateMultiFile } from '../../generators/multi-file-generator.js';
import type { PageInfo } from '../../types/index.js';

describe('Multi-file Generation Integration', () => {
  const testOutputDir = join(process.cwd(), 'test-output');

  beforeEach(() => {
    // Clean up before each test
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
    mkdirSync(testOutputDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up after each test
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  const mockPages: PageInfo[] = [
    {
      url: 'https://example.com/',
      title: 'Home Page',
      description: 'Welcome to our website',
      screenshot: 'screenshots/home.png',
      elements: [
        {
          type: 'button',
          text: 'Get Started',
          description: 'Click to begin',
        },
        {
          type: 'link',
          text: 'About',
          description: 'Learn more about us',
        },
      ],
      links: ['https://example.com/about', 'https://example.com/contact'],
    },
    {
      url: 'https://example.com/about',
      title: 'About Us',
      description: 'Learn about our company',
      elements: [
        {
          type: 'section',
          text: 'Our Mission',
          description: 'Read about our mission',
        },
      ],
      links: ['https://example.com/'],
    },
  ];

  describe('generateMultiFile', () => {
    it('should generate multi-file documentation with user-guide template', async () => {
      const result = await generateMultiFile(mockPages, {
        template: 'user-guide',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      expect(result.filesGenerated).toBeGreaterThan(0);
      expect(result.templateName).toBe('user-guide');
      expect(result.metadata.pageCount).toBe(2);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should create directory structure', async () => {
      await generateMultiFile(mockPages, {
        template: 'user-guide',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      expect(existsSync(testOutputDir)).toBe(true);
      expect(existsSync(join(testOutputDir, 'docs'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'docs', 'navigation'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'docs', 'pages'))).toBe(true);
    });

    it('should generate index file', async () => {
      await generateMultiFile(mockPages, {
        template: 'user-guide',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      const indexPath = join(testOutputDir, 'docs', 'index.md');
      expect(existsSync(indexPath)).toBe(true);
    });

    it('should generate sitemap file', async () => {
      await generateMultiFile(mockPages, {
        template: 'user-guide',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      const sitemapPath = join(testOutputDir, 'docs', 'sitemap.md');
      expect(existsSync(sitemapPath)).toBe(true);
    });

    it('should generate navigation files', async () => {
      await generateMultiFile(mockPages, {
        template: 'user-guide',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      const gnbPath = join(testOutputDir, 'docs', 'navigation', 'global-navigation.md');
      const lnbPath = join(testOutputDir, 'docs', 'navigation', 'local-navigation.md');

      expect(existsSync(gnbPath)).toBe(true);
      expect(existsSync(lnbPath)).toBe(true);
    });

    it('should generate page-specific files', async () => {
      await generateMultiFile(mockPages, {
        template: 'user-guide',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      const pagesDir = join(testOutputDir, 'docs', 'pages');
      expect(existsSync(pagesDir)).toBe(true);

      const pageDirs = readdirSync(pagesDir);
      expect(pageDirs.length).toBeGreaterThan(0);
    });

    it('should work with technical template', async () => {
      const result = await generateMultiFile(mockPages, {
        template: 'technical',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      expect(result.templateName).toBe('technical');
      expect(result.filesGenerated).toBeGreaterThan(0);
    });

    it('should work with quick-start template', async () => {
      const result = await generateMultiFile(mockPages, {
        template: 'quick-start',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      expect(result.templateName).toBe('quick-start');
      expect(result.filesGenerated).toBeGreaterThan(0);
    });

    it('should extract features from pages', async () => {
      const result = await generateMultiFile(mockPages, {
        template: 'user-guide',
        outputDir: testOutputDir,
        baseUrl: 'https://example.com',
      });

      expect(result.metadata.featureCount).toBeGreaterThan(0);
    });
  });
});
