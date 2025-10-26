/**
 * Template Loader - Loads and validates templates
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { load as parseYaml } from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { TemplateDefinition, TemplateLoaderOptions } from './types.js';
import { BuiltinTemplate } from './types.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Template Loader Class
 */
export class TemplateLoader {
  private options: TemplateLoaderOptions;
  private cache: Map<string, TemplateDefinition>;
  private builtinTemplatesDir: string;

  constructor(options: TemplateLoaderOptions = {}) {
    this.options = {
      validate: true,
      cache: true,
      ...options,
    };
    this.cache = new Map();
    this.builtinTemplatesDir = join(__dirname, 'builtin');
  }

  /**
   * Load a template by name (builtin or custom)
   */
  loadTemplate(name: string): TemplateDefinition {
    // Check cache first
    if (this.options.cache && this.cache.has(name)) {
      logger.info(`Loading template '${name}' from cache`);
      return this.cache.get(name)!;
    }

    // Try builtin templates first
    if (this.isBuiltinTemplate(name)) {
      return this.loadBuiltinTemplate(name as BuiltinTemplate);
    }

    // Try custom template
    if (this.options.customTemplatesDir) {
      return this.loadCustomTemplate(name);
    }

    throw new Error(`Template '${name}' not found`);
  }

  /**
   * Load a builtin template
   */
  loadBuiltinTemplate(name: BuiltinTemplate): TemplateDefinition {
    const templatePath = join(this.builtinTemplatesDir, `${name}.yaml`);

    if (!existsSync(templatePath)) {
      throw new Error(`Builtin template '${name}' not found at ${templatePath}`);
    }

    logger.info(`Loading builtin template: ${name}`);
    return this.parseTemplateFile(templatePath, name);
  }

  /**
   * Load a custom template from file
   */
  loadCustomTemplate(nameOrPath: string): TemplateDefinition {
    let templatePath: string;

    // If it's a direct path
    if (nameOrPath.includes('/') || nameOrPath.includes('\\')) {
      templatePath = resolve(nameOrPath);
    } else if (this.options.customTemplatesDir) {
      // Look in custom templates directory
      templatePath = join(this.options.customTemplatesDir, `${nameOrPath}.yaml`);
    } else {
      throw new Error(`Custom templates directory not specified`);
    }

    if (!existsSync(templatePath)) {
      throw new Error(`Custom template not found at ${templatePath}`);
    }

    logger.info(`Loading custom template from: ${templatePath}`);
    return this.parseTemplateFile(templatePath, nameOrPath);
  }

  /**
   * Parse template file and validate
   */
  private parseTemplateFile(filePath: string, name: string): TemplateDefinition {
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const template = parseYaml(fileContent) as TemplateDefinition;

      // Validate if enabled
      if (this.options.validate) {
        this.validateTemplate(template);
      }

      // Cache if enabled
      if (this.options.cache) {
        this.cache.set(name, template);
      }

      logger.success(`Template '${name}' loaded successfully`);
      return template;
    } catch (error) {
      logger.error(`Failed to parse template file: ${filePath}`, error);
      throw new Error(
        `Failed to parse template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate template definition
   */
  private validateTemplate(template: TemplateDefinition): void {
    // Required fields
    if (!template.name) {
      throw new Error('Template must have a name');
    }

    if (!template.version) {
      throw new Error('Template must have a version');
    }

    if (!template.description) {
      throw new Error('Template must have a description');
    }

    // Structure validation
    if (!template.structure) {
      throw new Error('Template must define structure');
    }

    if (!template.structure.directories) {
      throw new Error('Template must define directories structure');
    }

    if (!template.structure.files) {
      throw new Error('Template must define files structure');
    }

    // Sections validation
    if (!template.sections || !Array.isArray(template.sections)) {
      throw new Error('Template must define sections array');
    }

    for (const section of template.sections) {
      if (!section.name || !section.title) {
        throw new Error(`Section must have name and title`);
      }
    }

    // Format validation
    if (!template.format) {
      throw new Error('Template must define format');
    }

    if (!['technical', 'functional', 'scenario-based'].includes(template.format.uiElementsStyle)) {
      throw new Error(`Invalid uiElementsStyle: ${template.format.uiElementsStyle}`);
    }

    logger.info(`Template '${template.name}' validation passed`);
  }

  /**
   * Check if template name is a builtin template
   */
  private isBuiltinTemplate(name: string): boolean {
    return Object.values(BuiltinTemplate).includes(name as BuiltinTemplate);
  }

  /**
   * List available builtin templates
   */
  listBuiltinTemplates(): BuiltinTemplate[] {
    return Object.values(BuiltinTemplate);
  }

  /**
   * Get template metadata without full loading
   */
  getTemplateMetadata(name: string): {
    name: string;
    version: string;
    description: string;
    author?: string;
  } {
    const template = this.loadTemplate(name);
    return {
      name: template.name,
      version: template.version,
      description: template.description,
      author: template.author,
    };
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Template cache cleared');
  }

  /**
   * Get cached template count
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Default template loader instance
 */
export const defaultTemplateLoader = new TemplateLoader();

/**
 * Load a template using default loader
 */
export function loadTemplate(name: string, options?: TemplateLoaderOptions): TemplateDefinition {
  if (options) {
    const loader = new TemplateLoader(options);
    return loader.loadTemplate(name);
  }
  return defaultTemplateLoader.loadTemplate(name);
}
