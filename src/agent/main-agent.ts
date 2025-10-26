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
      const modelName =
        this.config.agentModel || process.env.CLAUDE_MODEL || 'claude-opus-4-1-20250805';
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
      const toolUsageCount = 0;

      for await (const message of messageStream) {
        // Log all message types for debugging
        console.log(`[DEBUG] Message type: ${message.type}`);

        // Handle result
        if (message.type === 'result' && 'result' in message) {
          finalResult = message.result;
          logger.info('Received final result from agent');
          console.log(`[DEBUG] Final result (full): ${finalResult}`);
        }

        // Handle assistant messages
        if (message.type === 'assistant' && 'message' in message) {
          const assistantMessage = message.message;
          if ('content' in assistantMessage && Array.isArray(assistantMessage.content)) {
            for (const block of assistantMessage.content) {
              if ('text' in block && typeof block.text === 'string') {
                console.log(`[DEBUG] Assistant text (full): ${block.text}`);
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
                } catch (error) {
                  console.log(`[DEBUG] JSON parse error: ${error}`);
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
          // Extract JSON from markdown code blocks if present
          let jsonString = finalResult.trim();

          // Try to find markdown code block pattern: ```json ... ``` or ``` ... ```
          const codeBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1].trim();
          }

          const parsed = JSON.parse(jsonString);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
            pages.push(...parsed);
            logger.info(`Parsed ${pages.length} pages from final result`);
          }
        } catch (error) {
          logger.warn('Could not parse final result as page data');
          console.log(`[DEBUG] Parse error: ${error}`);
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
    const toolsInfo = hasMcp
      ? `TOOLS AVAILABLE: Playwright MCP browser automation
- browser_navigate(url) - Navigate to a URL
- browser_snapshot() - Get page content/structure
- browser_take_screenshot(path) - Capture screenshot
- Use these tools to crawl the website`
      : '⚠️ No browser tools available';

    const languageInfo = this.getLanguageInstruction();

    return `You are a user-focused documentation expert. Analyze websites from an END-USER perspective, not a technical perspective.

${toolsInfo}

${languageInfo}

ANALYSIS APPROACH:
- Think like a manual writer for end-users, not developers
- Group UI elements by FEATURES (what users want to accomplish)
- Describe in natural language how users interact with the page
- Focus on user scenarios and workflows

OUTPUT: Return ONLY a valid JSON array with this structure:
[
  {
    "url": "https://example.com/page",
    "title": "Page Title",
    "description": "What users can accomplish on this page (user-focused, not technical)",
    "screenshot": "screenshots/page.png",
    "links": ["url1", "url2"],
    "elements": [
      {
        "type": "button|input|form|link|section|heading|other",
        "text": "Element label/text (visible to users)",
        "description": "What happens when user interacts with this (natural language)",
        "ariaLabel": "Accessibility label if available"
      }
    ]
  }
]

CRITICAL RULES FOR USER-FRIENDLY DESCRIPTIONS:
✅ GOOD: "Click 'Sign In' to access your account"
❌ BAD: "button element for authentication"

✅ GOOD: "Enter your email address in this field"
❌ BAD: "input field of type email"

✅ GOOD: "Search for products by typing keywords here"
❌ BAD: "text input for search functionality"

✅ GOOD: "Navigate to the dashboard by clicking this link"
❌ BAD: "link element to /dashboard"

ELEMENT GROUPING HINTS:
- Login/Signup buttons → Authentication feature
- Search boxes → Search feature
- Navigation menus → Navigation feature
- Submit/Save buttons → Data submission feature
- Edit/Update buttons → Data modification feature

FORMAT REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- Descriptions must be user-friendly and scenario-based
- Capture main interactive elements that users need for tasks
- Use natural language that end-users would understand`;
  }

  /**
   * Build task-specific prompt
   */
  private buildTaskPrompt(): string {
    const depth = this.config.depth ?? 2;

    return `Analyze this website and create user-friendly documentation:

URL: ${this.config.url}
Max Depth: ${depth} levels

ANALYSIS STEPS (think like writing a user manual):
1. Use browser_navigate to visit ${this.config.url}
2. Use browser_snapshot to get page content and structure
3. Use browser_take_screenshot to capture the page appearance
4. Analyze from USER perspective:
   - What can users DO on this page?
   - What FEATURES are available?
   - How do users INTERACT with elements?
5. Extract user-focused information:
   - Page title and purpose (what users accomplish here)
   - Interactive elements with natural descriptions
   - Links to other pages
6. For depth ${depth}, follow ${depth > 1 ? 'up to ' + depth + ' link(s)' : '1 link'} and repeat steps 1-5
7. Return JSON array of ALL pages visited

REMEMBER: Write descriptions as if explaining to a non-technical user reading a manual.

Start now. Return ONLY the JSON array.`;
  }

  /**
   * Get language instruction for the agent
   */
  private getLanguageInstruction(): string {
    const language = this.config.language ?? 'en';

    const languageNames: Record<string, string> = {
      en: 'English',
      ko: 'Korean (한국어)',
      ja: 'Japanese (日本語)',
      zh: 'Chinese (中文)',
      es: 'Spanish (Español)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      pt: 'Portuguese (Português)',
      ru: 'Russian (Русский)',
      it: 'Italian (Italiano)',
    };

    const languageName = languageNames[language] || 'English';

    if (language === 'en') {
      return 'LANGUAGE: Extract content in English.';
    }

    return `LANGUAGE: Extract content and write descriptions in ${languageName}.
- Titles and descriptions should be in ${languageName}
- Element descriptions should be in ${languageName}
- Keep URLs and technical terms in their original form`;
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
