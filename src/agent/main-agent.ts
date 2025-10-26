/**
 * Main Agent - Claude Agent SDK based orchestrator
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { QuillConfig, AgentResult, PageInfo } from '../types/index.js';
import { loadMcpServers } from '../utils/mcp-loader.js';
import { logger } from '../utils/logger.js';

/**
 * Main orchestrator agent using Claude Agent SDK
 */
export class MainAgent {
  private config: QuillConfig;

  constructor(config: QuillConfig) {
    this.config = config;
  }

  /**
   * Execute documentation generation workflow using Agent SDK
   */
  async execute(): Promise<AgentResult<PageInfo[]>> {
    try {
      logger.info('Starting Claude Agent SDK workflow...');

      // 1. Load MCP servers
      const mcpServers = loadMcpServers();
      const hasMcp = Object.keys(mcpServers).length > 0;

      const systemPrompt = this.buildSystemPrompt(hasMcp);
      const taskPrompt = this.buildTaskPrompt();

      // 3. Execute query (SDK handles credentials automatically)
      logger.info('Executing Agent query...');
      const modelName = this.config.agentModel || process.env.CLAUDE_MODEL || 'claude-opus-4-1-20250805';
      logger.info(`Model: ${modelName}`);

      const messageStream = query({
        prompt: taskPrompt,
        options: {
          model: modelName,
          systemPrompt,
          permissionMode:
            (this.config.permissionMode as any) ||
            (process.env.CLAUDE_PERMISSION_MODE as any) ||
            'default',
          allowedTools: this.getAllowedTools(),
          mcpServers: hasMcp ? mcpServers : undefined,
        },
      });

      // 5. Process streaming response
      let finalResult = '';
      const pages: PageInfo[] = [];
      let toolUsageCount = 0;

      for await (const message of messageStream) {
        // Handle result
        if (message.type === 'result' && 'result' in message) {
          finalResult = message.result as string;
          logger.info('Received final result from agent');
        }

        // Handle assistant messages
        if (message.type === 'assistant' && 'message' in message) {
          const assistantMessage = message.message;
          if ('content' in assistantMessage && Array.isArray(assistantMessage.content)) {
            for (const block of assistantMessage.content) {
              if ('text' in block && typeof block.text === 'string') {
                // Try to parse JSON results from agent
                try {
                  const parsed = JSON.parse(block.text);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    // Validate it's page data
                    if (parsed[0].url && parsed[0].title) {
                      pages.push(...parsed);
                      logger.info(`Agent returned ${parsed.length} pages`);
                    }
                  }
                } catch {
                  // Not JSON or parsing failed, continue
                }
              }
            }
          }
        }
      }

      logger.info('Agent execution completed');
      logger.info(`- Tool usages: ${toolUsageCount}`);
      logger.info(`- Pages found: ${pages.length}`);

      // If no pages in structured format, try parsing final result
      if (pages.length === 0 && finalResult) {
        try {
          const parsed = JSON.parse(finalResult);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
            pages.push(...parsed);
            logger.info(`Parsed ${pages.length} pages from final result`);
          }
        } catch {
          logger.warn('Could not parse final result as page data');
        }
      }

      if (pages.length === 0) {
        logger.warn('No pages were extracted. Agent may have failed to crawl.');
        return {
          success: false,
          error: 'No pages were crawled. Check if MCP servers are configured correctly.',
        };
      }

      return {
        success: true,
        data: pages,
      };
    } catch (error) {
      logger.error('Agent execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Build system prompt for the agent
   */
  private buildSystemPrompt(hasMcp: boolean): string {
    const mcpNote = hasMcp
      ? 'You have access to Playwright MCP for browser automation.'
      : '⚠️ WARNING: No MCP servers are available. You cannot use Playwright tools.';

    return `You are an expert technical documentation generator powered by Claude.

${mcpNote}

Your task is to:
1. Navigate web applications using available tools
2. Crawl pages systematically (BFS algorithm, depth-limited)
3. Analyze UI elements and their purpose using AI understanding
4. Generate MEANINGFUL, DETAILED descriptions for each element
5. Capture screenshots of important pages
6. Return structured page information as JSON

Output Format:
You MUST return a JSON array of pages with this EXACT structure:
[
  {
    "url": "https://example.com/page",
    "title": "Page Title",
    "description": "AI-generated page description explaining what this page does",
    "screenshot": "path/to/screenshot.png",
    "links": ["https://example.com/link1", "https://example.com/link2"],
    "elements": [
      {
        "type": "button",
        "text": "Submit",
        "description": "Submit button to save user profile changes and update the database"
      },
      {
        "type": "input",
        "text": "Email Address",
        "description": "Text input field for entering user email address, validated for correct email format"
      }
    ]
  }
]

CRITICAL REQUIREMENTS:
- Element descriptions MUST be meaningful and explain PURPOSE (not just "button" or "input")
- Prioritize important pages (dashboards, main features, frequently used pages)
- Respect the crawling depth limit
- Handle authentication if configured
- Be thorough but efficient with tool usage
- Return ONLY the JSON array, no additional text

Example of GOOD element descriptions:
✅ "Login button that authenticates user credentials and redirects to dashboard"
✅ "Search input field for finding products by name, category, or SKU"
✅ "Settings link that opens user preferences panel for customizing notifications"

Example of BAD element descriptions:
❌ "button"
❌ "input field"
❌ "link"`;
  }

  /**
   * Build task-specific prompt
   */
  private buildTaskPrompt(): string {
    const depth = this.config.depth ?? 2;
    const authNote = this.config.auth
      ? `

**Authentication Required:**
- Login URL: ${this.config.auth.loginUrl || this.config.url}
- Use the configured credentials to authenticate before crawling
- Maintain session throughout the crawl`
      : '';

    return `Generate comprehensive documentation for the following web application:

**Target URL:** ${this.config.url}
**Crawling Depth:** ${depth} levels
**Output Format:** ${this.config.format || 'markdown'}${authNote}

**Workflow:**
1. Navigate to ${this.config.url}${this.config.auth ? '\n2. Authenticate using provided credentials' : ''}
${this.config.auth ? '3' : '2'}. Start crawling from the home page
${this.config.auth ? '4' : '3'}. For each page (up to depth ${depth}):
   - Take screenshot
   - Extract ALL interactive UI elements (buttons, inputs, links, forms, etc.)
   - Generate AI-powered descriptions explaining each element's PURPOSE
   - Identify navigation links for next crawl level
${this.config.auth ? '5' : '4'}. Return complete JSON array of all pages crawled

**Important:**
- Focus on meaningful element descriptions using your AI understanding
- Prioritize user-facing pages over technical/admin pages
- Maintain consistent JSON structure
- Be efficient with screenshot capture

Begin crawling now and return the JSON array.`;
  }

  /**
   * Get allowed tools based on configuration
   */
  private getAllowedTools(): string[] {
    // Check config first
    if (this.config.allowedTools && this.config.allowedTools.length > 0) {
      return this.config.allowedTools;
    }

    // Check environment variable
    const envTools = process.env.CLAUDE_ALLOWED_TOOLS;
    if (envTools) {
      return envTools.split(',').map((t) => t.trim());
    }

    // Default tools
    return [
      'WebSearch',
      'WebFetch',
      'Read',
      'Write',
      'Bash',
      // MCP tools will be available if MCP servers are loaded
    ];
  }
}
