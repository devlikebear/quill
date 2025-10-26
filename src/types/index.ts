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

  // Agent SDK options (v1.0.0+)
  /** Claude model to use (default: claude-opus-4-1-20250805) */
  agentModel?: string;
  /** Permission mode for Claude Agent SDK */
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
  /** Allowed tools for Claude Agent SDK */
  allowedTools?: string[];
  /** MCP servers configuration (overrides ~/.claude/mcp-servers.json) */
  mcpServers?: Record<string, any>;
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
  /** Interactive authentication mode */
  interactive?: boolean;
  /** Authentication timeout in milliseconds */
  timeout?: number;
}

/**
 * User credentials
 */
export interface Credentials {
  /** Username */
  username: string;
  /** Password */
  password: string;
}

/**
 * Session state from Playwright
 */
export interface SessionState {
  /** Cookies */
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  /** Origins with localStorage */
  origins: Array<{
    origin: string;
    localStorage: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

/**
 * Login form elements
 */
export interface FormElements {
  /** Username input element selector */
  usernameSelector?: string;
  /** Password input element selector */
  passwordSelector?: string;
  /** Submit button selector */
  submitSelector?: string;
}

/**
 * Login options
 */
export interface LoginOptions {
  /** Login URL */
  loginUrl: string;
  /** Login timeout in milliseconds */
  timeout?: number;
  /** Success URL pattern (regex or string) */
  successPattern?: string;
  /** Error message selectors */
  errorSelectors?: string[];
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
  type: 'button' | 'input' | 'form' | 'link' | 'section' | 'heading' | 'other';
  /** Element text content */
  text: string;
  /** Element selector */
  selector?: string;
  /** Element description */
  description?: string;
  /** Accessibility label */
  ariaLabel?: string;
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

/**
 * Document structure for generated documentation
 */
export interface Document {
  /** Document title */
  title: string;
  /** Document metadata */
  metadata: DocumentMetadata;
  /** Table of contents */
  toc: TOC;
  /** Document sections */
  sections: Section[];
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  /** Generation timestamp */
  generatedAt: string;
  /** Base URL of the documented site */
  baseUrl: string;
  /** Total number of pages */
  pageCount: number;
  /** Documentation format */
  format?: OutputFormat;
  /** Generator version */
  version?: string;
}

/**
 * Table of contents
 */
export interface TOC {
  /** TOC items */
  items: TOCItem[];
}

/**
 * Table of contents item
 */
export interface TOCItem {
  /** Section title */
  title: string;
  /** Anchor link */
  anchor: string;
  /** Nesting depth */
  depth: number;
  /** Child items */
  children?: TOCItem[];
}

/**
 * Document section
 */
export interface Section {
  /** Unique section ID */
  id: string;
  /** Section title */
  title: string;
  /** Page URL */
  url: string;
  /** Section description */
  description?: string;
  /** Screenshot path */
  screenshot?: string;
  /** UI elements in this section */
  elements?: UIElement[];
  /** Additional content */
  content?: string;
}

/**
 * Formatter options
 */
export interface FormatterOptions {
  /** Include table of contents */
  includeToc?: boolean;
  /** Include screenshots */
  includeScreenshots?: boolean;
  /** Include UI elements */
  includeElements?: boolean;
  /** Custom template path */
  templatePath?: string;
  /** Additional formatting options */
  custom?: Record<string, unknown>;
}
