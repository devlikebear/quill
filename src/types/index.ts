/**
 * Quill - TypeScript Type Definitions
 */

/**
 * Configuration for Quill documentation generation
 */
export interface QuillConfig {
  /** Target URL to document */
  url: string;
  /** Crawling depth (number of levels to traverse) */
  depth?: number;
  /** Output format */
  format?: OutputFormat;
  /** Output file path */
  output?: string;
  /** Language for documentation */
  language?: string;
  /** Authentication configuration */
  auth?: AuthConfig;
  /** Documentation options */
  options?: DocumentationOptions;
}

/**
 * Output format types
 */
export type OutputFormat = 'docx' | 'markdown' | 'html' | 'pdf';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** Authentication type */
  type: 'session' | 'basic' | 'oauth';
  /** Login URL (for session-based auth) */
  loginUrl?: string;
  /** Username */
  username?: string;
  /** Password */
  password?: string;
  /** Session storage path */
  sessionPath?: string;
}

/**
 * Documentation generation options
 */
export interface DocumentationOptions {
  /** Include table of contents */
  includeToc?: boolean;
  /** Include screenshots */
  includeScreenshots?: boolean;
  /** Screenshot quality */
  screenshotQuality?: 'low' | 'medium' | 'high';
  /** Maximum pages to crawl */
  maxPages?: number;
  /** Include patterns (glob) */
  includePattern?: string;
  /** Exclude patterns (glob) */
  excludePattern?: string;
}

/**
 * Page information captured during crawling
 */
export interface PageInfo {
  /** Page URL */
  url: string;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Screenshot path */
  screenshot?: string;
  /** UI elements found */
  elements?: UIElement[];
  /** Links to other pages */
  links?: string[];
}

/**
 * UI element information
 */
export interface UIElement {
  /** Element type */
  type: 'button' | 'input' | 'form' | 'link' | 'section' | 'other';
  /** Element label or text */
  label: string;
  /** Element selector */
  selector?: string;
  /** Element description */
  description?: string;
}

/**
 * Agent task result
 */
export interface AgentResult<T = unknown> {
  /** Success status */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Command to run */
  command: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Claude Agent configuration
 */
export interface AgentConfig {
  /** System prompt */
  systemPrompt?: string;
  /** Available tools */
  tools?: string[];
  /** MCP servers */
  mcpServers?: MCPServerConfig[];
  /** Plugin configurations */
  plugins?: string[];
}
