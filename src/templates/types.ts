/**
 * Template System Types
 */

/**
 * Built-in template names
 */
export enum BuiltinTemplate {
  UserGuide = 'user-guide',
  Technical = 'technical',
  QuickStart = 'quick-start',
}

/**
 * Template section configuration
 */
export interface TemplateSection {
  /** Section name */
  name: string;
  /** Section title */
  title: string;
  /** Section description */
  description?: string;
  /** Whether this section is enabled */
  enabled: boolean;
  /** Sub-sections */
  subsections?: string[];
}

/**
 * File structure configuration
 */
export interface FileStructure {
  /** Directory name */
  dir: string;
  /** File pattern (e.g., "{page-id}-overview.md") */
  pattern: string;
  /** Whether to create subdirectories */
  useSubdirectories?: boolean;
}

/**
 * Content formatting options
 */
export interface ContentFormat {
  /** How to present UI elements */
  uiElementsStyle: 'technical' | 'functional' | 'scenario-based';
  /** Include screenshots */
  includeScreenshots: boolean;
  /** Include navigation breadcrumbs */
  includeBreadcrumbs: boolean;
  /** Include table of contents per page */
  includePageToc: boolean;
}

/**
 * Complete template definition
 */
export interface TemplateDefinition {
  /** Template name */
  name: string;
  /** Template version */
  version: string;
  /** Template description */
  description: string;
  /** Author information */
  author?: string;

  /** File structure configuration */
  structure: {
    /** Root directory structure */
    directories: {
      root?: string;
      navigation?: string;
      pages?: string;
      features?: string;
      assets?: string;
    };

    /** File naming patterns */
    files: {
      index?: string;
      sitemap?: string;
      gnb?: string;
      lnb?: string;
      pageOverview?: string;
      pageInstructions?: string;
      feature?: string;
    };
  };

  /** Sections to generate */
  sections: TemplateSection[];

  /** Content formatting */
  format: ContentFormat;

  /** Custom Handlebars helpers */
  helpers?: Record<string, string>;

  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Template context for rendering
 */
export interface TemplateContext {
  /** Document metadata */
  metadata: {
    title: string;
    generatedAt: string;
    baseUrl: string;
    version: string;
  };

  /** Site structure */
  sitemap: {
    pages: Array<{
      id: string;
      url: string;
      title: string;
      level: number;
      parent?: string;
    }>;
  };

  /** Navigation structure */
  navigation: {
    gnb: Array<{
      title: string;
      url: string;
      children?: Array<{ title: string; url: string }>;
    }>;
    lnb: Array<{
      title: string;
      url: string;
    }>;
    breadcrumbs: Array<{
      title: string;
      url: string;
    }>;
  };

  /** Page data */
  pages: Array<{
    id: string;
    url: string;
    title: string;
    description: string;
    screenshot?: string;
    features: Array<{
      name: string;
      description: string;
      scenario?: string;
      elements: Array<{
        type: string;
        text: string;
        description: string;
      }>;
    }>;
    links: string[];
  }>;

  /** Features extracted from pages */
  features: Array<{
    id: string;
    name: string;
    description: string;
    pages: string[];
    elements: any[];
  }>;
}

/**
 * Template loader options
 */
export interface TemplateLoaderOptions {
  /** Directory containing custom templates */
  customTemplatesDir?: string;
  /** Validate template against schema */
  validate?: boolean;
  /** Cache loaded templates */
  cache?: boolean;
}

/**
 * Template rendering result
 */
export interface RenderResult {
  /** Generated files */
  files: Array<{
    path: string;
    content: string;
  }>;
  /** Metadata about generation */
  metadata: {
    templateName: string;
    templateVersion: string;
    filesGenerated: number;
    generatedAt: string;
  };
}
