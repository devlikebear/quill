/**
 * Multi-file Generator - Generates structured multi-file documentation
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import type { PageInfo, Document } from '../types/index.js';
import type { TemplateDefinition, TemplateContext, RenderResult } from '../templates/types.js';
import { TemplateLoader } from '../templates/loader.js';
import { TemplateEngine } from '../templates/engine.js';
import { logger } from '../utils/logger.js';
import { SitemapGenerator } from './sitemap-generator.js';
import { NavigationGenerator } from './navigation-generator.js';
import { FeatureExtractor } from './feature-extractor.js';

/**
 * Multi-file generator options
 */
export interface MultiFileGeneratorOptions {
  /** Template name or path */
  template?: string;
  /** Output directory */
  outputDir: string;
  /** Base URL of the site */
  baseUrl: string;
  /** Document title */
  title?: string;
  /** Custom template directory */
  customTemplateDir?: string;
}

/**
 * Multi-file generation result
 */
export interface MultiFileGenerationResult {
  /** Number of files generated */
  filesGenerated: number;
  /** Output directory */
  outputDir: string;
  /** List of generated file paths */
  files: string[];
  /** Template used */
  templateName: string;
  /** Generation metadata */
  metadata: {
    generatedAt: string;
    baseUrl: string;
    pageCount: number;
    featureCount: number;
  };
}

/**
 * Multi-file Generator
 */
export class MultiFileGenerator {
  private options: MultiFileGeneratorOptions;
  private templateLoader: TemplateLoader;
  private templateEngine: TemplateEngine;
  private sitemapGenerator: SitemapGenerator;
  private navigationGenerator: NavigationGenerator;
  private featureExtractor: FeatureExtractor;

  constructor(options: MultiFileGeneratorOptions) {
    this.options = options;
    this.templateLoader = new TemplateLoader({
      customTemplatesDir: options.customTemplateDir,
    });
    this.templateEngine = new TemplateEngine();
    this.sitemapGenerator = new SitemapGenerator();
    this.navigationGenerator = new NavigationGenerator();
    this.featureExtractor = new FeatureExtractor();
  }

  /**
   * Generate multi-file documentation
   */
  async generate(
    pages: PageInfo[],
    document?: Document
  ): Promise<MultiFileGenerationResult> {
    try {
      logger.info('Starting multi-file documentation generation...');

      // Load template
      const templateName = this.options.template || 'user-guide';
      const template = this.templateLoader.loadTemplate(templateName);
      logger.info(`Using template: ${template.name} (v${template.version})`);

      // Build template context
      const context = this.buildContext(pages, document, template);

      // Render template
      const renderResult = this.templateEngine.render(template, context);

      // Write files to disk
      const writtenFiles = await this.writeFiles(renderResult, template);

      const result: MultiFileGenerationResult = {
        filesGenerated: writtenFiles.length,
        outputDir: this.options.outputDir,
        files: writtenFiles,
        templateName: template.name,
        metadata: {
          generatedAt: new Date().toISOString(),
          baseUrl: this.options.baseUrl,
          pageCount: pages.length,
          featureCount: context.features.length,
        },
      };

      logger.success(
        `Multi-file generation complete: ${result.filesGenerated} files in ${result.outputDir}`
      );

      return result;
    } catch (error) {
      logger.error('Multi-file generation failed', error);
      throw new Error(
        `Multi-file generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build template context from pages and document
   */
  private buildContext(
    pages: PageInfo[],
    document: Document | undefined,
    template: TemplateDefinition
  ): TemplateContext {
    logger.info('Building template context...');

    // Generate sitemap
    const sitemap = this.sitemapGenerator.generate(pages, this.options.baseUrl);

    // Generate navigation
    const navigation = this.navigationGenerator.generate(pages, this.options.baseUrl);

    // Extract features from pages
    const features = this.featureExtractor.extract(pages, template.format.uiElementsStyle);

    // Build metadata
    const metadata = {
      title: this.options.title || document?.title || 'Documentation',
      description: `Documentation for ${this.options.baseUrl}`,
      baseUrl: this.options.baseUrl,
      generatedAt: new Date().toISOString(),
      version: '1.1.0',
    };

    // Transform pages to template format
    const templatePages = pages.map((page, index) => ({
      id: this.generatePageId(page.url),
      url: page.url,
      title: page.title,
      description: page.description || '',
      screenshot: page.screenshot,
      features: features.filter((f) => f.pages.includes(this.generatePageId(page.url))),
      links: page.links || [],
      level: this.calculatePageLevel(page.url, this.options.baseUrl),
    }));

    const context: TemplateContext = {
      metadata,
      sitemap,
      navigation,
      pages: templatePages,
      features,
    };

    logger.info(`Context built: ${pages.length} pages, ${features.length} features`);
    return context;
  }

  /**
   * Write rendered files to disk
   */
  private async writeFiles(
    renderResult: RenderResult,
    template: TemplateDefinition
  ): Promise<string[]> {
    logger.info(`Writing ${renderResult.files.length} files to ${this.options.outputDir}...`);

    const writtenFiles: string[] = [];

    for (const file of renderResult.files) {
      const fullPath = join(this.options.outputDir, file.path);

      // Create directory if needed
      const dir = dirname(fullPath);
      try {
        mkdirSync(dir, { recursive: true });
      } catch (error) {
        // Directory already exists, ignore
      }

      // Write file
      writeFileSync(fullPath, file.content, 'utf-8');
      writtenFiles.push(fullPath);
      logger.debug(`Written: ${fullPath}`);
    }

    logger.success(`${writtenFiles.length} files written successfully`);
    return writtenFiles;
  }

  /**
   * Generate page ID from URL
   */
  private generatePageId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove leading/trailing slashes and replace special chars
      const id = pathname
        .replace(/^\/+|\/+$/g, '')
        .replace(/\//g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase();

      return id || 'index';
    } catch {
      // Fallback for invalid URLs
      return url
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase()
        .slice(0, 50);
    }
  }

  /**
   * Calculate page level based on URL path depth
   */
  private calculatePageLevel(url: string, baseUrl: string): number {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(baseUrl);

      const urlPath = urlObj.pathname.replace(/^\/+|\/+$/g, '');
      const basePath = baseUrlObj.pathname.replace(/^\/+|\/+$/g, '');

      // Remove base path if present
      const relativePath = urlPath.startsWith(basePath)
        ? urlPath.slice(basePath.length).replace(/^\/+/, '')
        : urlPath;

      if (!relativePath) return 1; // Root level

      // Count path segments
      const segments = relativePath.split('/').filter((s) => s.length > 0);
      return Math.min(segments.length + 1, 6); // Max level 6
    } catch {
      return 1; // Default to level 1
    }
  }
}

/**
 * Generate multi-file documentation
 */
export async function generateMultiFile(
  pages: PageInfo[],
  options: MultiFileGeneratorOptions,
  document?: Document
): Promise<MultiFileGenerationResult> {
  const generator = new MultiFileGenerator(options);
  return generator.generate(pages, document);
}
