/**
 * Template Engine - Renders templates with Handlebars
 */

import Handlebars from 'handlebars';
import { join } from 'path';
import type { TemplateDefinition, TemplateContext, RenderResult } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Template Engine Options
 */
export interface TemplateEngineOptions {
  /** Custom Handlebars helpers */
  customHelpers?: Record<string, Handlebars.HelperDelegate>;
  /** Enable strict mode */
  strict?: boolean;
}

/**
 * Template Engine Class
 */
export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private options: TemplateEngineOptions;
  private helperNames: Set<string>;

  constructor(options: TemplateEngineOptions = {}) {
    this.options = {
      strict: true,
      ...options,
    };
    this.handlebars = Handlebars.create();
    this.helperNames = new Set();
    this.registerBuiltinHelpers();
    this.registerCustomHelpers();
  }

  /**
   * Register built-in Handlebars helpers
   */
  private registerBuiltinHelpers(): void {
    const registerHelper = (name: string, fn: Handlebars.HelperDelegate) => {
      this.handlebars.registerHelper(name, fn);
      this.helperNames.add(name);
    };

    // Date formatting helper
    registerHelper('formatDate', (date: string) => {
      return new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Markdown link helper
    registerHelper('link', (text: string, url: string) => {
      return new Handlebars.SafeString(`[${text}](${url})`);
    });

    // Conditional helper
    registerHelper('eq', (a: any, b: any) => {
      return a === b;
    });

    // Array length helper
    registerHelper('length', (array: any[]) => {
      return array ? array.length : 0;
    });

    // Uppercase helper
    registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Join array helper
    registerHelper('join', (array: any[], separator: string = ', ') => {
      return array ? array.join(separator) : '';
    });

    // Markdown heading helper
    registerHelper('heading', (level: number, text: string) => {
      const prefix = '#'.repeat(Math.max(1, Math.min(6, level)));
      return new Handlebars.SafeString(`${prefix} ${text}`);
    });

    // Code block helper
    registerHelper('code', (content: string, language: string = '') => {
      return new Handlebars.SafeString(`\`\`\`${language}\n${content}\n\`\`\``);
    });

    // List item helper
    registerHelper('listItem', (text: string, ordered: boolean = false, index?: number) => {
      const prefix = ordered ? `${index! + 1}.` : '-';
      return `${prefix} ${text}`;
    });

    logger.info('Built-in Handlebars helpers registered');
  }

  /**
   * Register custom Handlebars helpers from options
   */
  private registerCustomHelpers(): void {
    if (this.options.customHelpers) {
      Object.entries(this.options.customHelpers).forEach(([name, helper]) => {
        this.handlebars.registerHelper(name, helper);
        this.helperNames.add(name);
      });
      logger.info(`Registered ${Object.keys(this.options.customHelpers).length} custom helpers`);
    }
  }

  /**
   * Render a template with context data
   */
  render(template: TemplateDefinition, context: TemplateContext): RenderResult {
    try {
      logger.info(`Rendering template: ${template.name}`);

      const files: Array<{ path: string; content: string }> = [];

      // Generate index file
      if (template.structure.files.index) {
        const indexContent = this.renderIndex(template, context);
        files.push({
          path: join(template.structure.directories.root || '', template.structure.files.index),
          content: indexContent,
        });
      }

      // Generate sitemap file
      if (template.structure.files.sitemap) {
        const sitemapContent = this.renderSitemap(template, context);
        files.push({
          path: join(template.structure.directories.root || '', template.structure.files.sitemap),
          content: sitemapContent,
        });
      }

      // Generate navigation files
      if (template.structure.files.gnb && template.structure.directories.navigation) {
        const gnbContent = this.renderGNB(template, context);
        files.push({
          path: join(template.structure.directories.root || '', template.structure.files.gnb),
          content: gnbContent,
        });
      }

      if (template.structure.files.lnb && template.structure.directories.navigation) {
        const lnbContent = this.renderLNB(template, context);
        files.push({
          path: join(template.structure.directories.root || '', template.structure.files.lnb),
          content: lnbContent,
        });
      }

      // Generate page files
      if (template.structure.files.pageOverview && template.structure.directories.pages) {
        context.pages.forEach((page) => {
          const overviewPattern = template.structure.files.pageOverview!;
          const overviewPath = overviewPattern.replace('{page-id}', page.id);
          const overviewContent = this.renderPageOverview(template, context, page);
          files.push({
            path: join(template.structure.directories.root || '', overviewPath),
            content: overviewContent,
          });

          // Generate instructions if enabled
          if (template.structure.files.pageInstructions) {
            const instructionsPattern = template.structure.files.pageInstructions;
            const instructionsPath = instructionsPattern.replace('{page-id}', page.id);
            const instructionsContent = this.renderPageInstructions(template, context, page);
            files.push({
              path: join(template.structure.directories.root || '', instructionsPath),
              content: instructionsContent,
            });
          }
        });
      }

      // Generate feature files
      if (template.structure.files.feature && template.structure.directories.features) {
        context.features.forEach((feature) => {
          const featurePattern = template.structure.files.feature!;
          const featurePath = featurePattern.replace('{feature-id}', feature.id);
          const featureContent = this.renderFeature(template, context, feature);
          files.push({
            path: join(template.structure.directories.root || '', featurePath),
            content: featureContent,
          });
        });
      }

      const result: RenderResult = {
        files,
        metadata: {
          templateName: template.name,
          templateVersion: template.version,
          filesGenerated: files.length,
          generatedAt: new Date().toISOString(),
        },
      };

      logger.success(`Template rendered successfully: ${files.length} files generated`);
      return result;
    } catch (error) {
      logger.error('Failed to render template', error);
      throw new Error(
        `Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Render index file
   */
  private renderIndex(template: TemplateDefinition, context: TemplateContext): string {
    const templateStr = `
# {{metadata.title}}

{{metadata.description}}

**Generated**: {{formatDate metadata.generatedAt}}
**Version**: {{metadata.version}}
**Base URL**: {{metadata.baseUrl}}

## Overview

This documentation provides comprehensive information about the application.

## Navigation

- [Site Map]({{sitemapLink}})
{{#each navigation.gnb}}
- [{{title}}]({{url}})
{{/each}}

## Pages

{{#each sitemap.pages}}
- [{{title}}]({{url}}) - {{description}}
{{/each}}

---

*Generated with Quill v{{metadata.version}}*
`.trim();

    const compiled = this.handlebars.compile(templateStr);
    return compiled({
      ...context,
      sitemapLink: template.structure.files.sitemap || '#',
    });
  }

  /**
   * Render sitemap file
   */
  private renderSitemap(template: TemplateDefinition, context: TemplateContext): string {
    const templateStr = `
# Site Map

**Base URL**: {{metadata.baseUrl}}
**Generated**: {{formatDate metadata.generatedAt}}

## Page Structure

{{#each sitemap.pages}}
{{#if (eq level 1)}}
### [{{title}}]({{url}})
{{else if (eq level 2)}}
#### [{{title}}]({{url}})
{{else}}
##### [{{title}}]({{url}})
{{/if}}
{{/each}}

## Features

{{#each features}}
- **{{name}}**: {{description}}
  - Used in: {{join pages ", "}}
{{/each}}
`.trim();

    const compiled = this.handlebars.compile(templateStr);
    return compiled(context);
  }

  /**
   * Render Global Navigation (GNB)
   */
  private renderGNB(template: TemplateDefinition, context: TemplateContext): string {
    const templateStr = `
# Global Navigation

{{#each navigation.gnb}}
## {{title}}

**URL**: {{url}}

{{#if children}}
### Sub-navigation
{{#each children}}
- [{{title}}]({{url}})
{{/each}}
{{/if}}
{{/each}}
`.trim();

    const compiled = this.handlebars.compile(templateStr);
    return compiled(context);
  }

  /**
   * Render Local Navigation (LNB)
   */
  private renderLNB(template: TemplateDefinition, context: TemplateContext): string {
    const templateStr = `
# Local Navigation

{{#each navigation.lnb}}
- [{{title}}]({{url}})
{{/each}}

## Breadcrumbs

{{#each navigation.breadcrumbs}}
{{#unless @last}}[{{title}}]({{url}}) > {{else}}{{title}}{{/unless}}
{{/each}}
`.trim();

    const compiled = this.handlebars.compile(templateStr);
    return compiled(context);
  }

  /**
   * Render page overview
   */
  private renderPageOverview(
    template: TemplateDefinition,
    context: TemplateContext,
    page: TemplateContext['pages'][0]
  ): string {
    const templateStr = `
# {{title}}

**URL**: {{url}}

{{#if screenshot}}
![Screenshot]({{screenshot}})
{{/if}}

## Description

{{description}}

## Features

{{#each features}}
### {{name}}

{{description}}

{{#if scenario}}
**Usage Scenario**: {{scenario}}
{{/if}}

{{#if elements}}
**UI Elements**:
{{#each elements}}
- **{{type}}**: {{text}} - {{description}}
{{/each}}
{{/if}}
{{/each}}

{{#if links}}
## Related Links

{{#each links}}
- [{{this}}]({{this}})
{{/each}}
{{/if}}
`.trim();

    const compiled = this.handlebars.compile(templateStr);
    return compiled(page);
  }

  /**
   * Render page instructions
   */
  private renderPageInstructions(
    template: TemplateDefinition,
    context: TemplateContext,
    page: TemplateContext['pages'][0]
  ): string {
    const templateStr = `
# {{title}} - Instructions

## How to Use

{{#each features}}
### {{name}}

{{#if scenario}}
**Scenario**: {{scenario}}
{{/if}}

**Steps**:

{{#each elements}}
{{@index}}. {{description}}
{{/each}}
{{/each}}

## Tips

- Review the [overview](overview.md) for more context
- Check related pages in the navigation
`.trim();

    const compiled = this.handlebars.compile(templateStr);
    return compiled(page);
  }

  /**
   * Render feature file
   */
  private renderFeature(
    template: TemplateDefinition,
    context: TemplateContext,
    feature: TemplateContext['features'][0]
  ): string {
    const templateStr = `
# {{name}}

{{description}}

## Used In

{{#each pages}}
- [{{this}}](../pages/{{this}}/overview.md)
{{/each}}

## UI Elements

{{#each elements}}
- **{{type}}**: {{text}}
  - {{description}}
{{/each}}
`.trim();

    const compiled = this.handlebars.compile(templateStr);
    return compiled(feature);
  }

  /**
   * Compile a template string
   */
  compileTemplate(templateString: string): Handlebars.TemplateDelegate {
    return this.handlebars.compile(templateString, {
      strict: this.options.strict,
      noEscape: false,
    });
  }

  /**
   * Get registered helper names
   */
  getHelperNames(): string[] {
    return Array.from(this.helperNames);
  }
}

/**
 * Default template engine instance
 */
export const defaultTemplateEngine = new TemplateEngine();

/**
 * Render a template using default engine
 */
export function renderTemplate(
  template: TemplateDefinition,
  context: TemplateContext,
  options?: TemplateEngineOptions
): RenderResult {
  if (options) {
    const engine = new TemplateEngine(options);
    return engine.render(template, context);
  }
  return defaultTemplateEngine.render(template, context);
}
