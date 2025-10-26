/**
 * Main Agent - Orchestrates the documentation generation workflow
 */

import type { QuillConfig, AgentResult, PageInfo, Document } from '../types/index.js';
import { PlaywrightMCP } from '../mcp/playwright.js';
import { WebCrawlerAgent } from './subagents/web-crawler.js';
import { DocumentGenerator } from './subagents/document-generator.js';
import { LoginAgent } from './subagents/login-agent.js';
import { SessionManager } from '../auth/session-manager.js';
import { CredentialProvider } from '../auth/credential-provider.js';
import { logger } from '../utils/logger.js';

/**
 * Main orchestrator agent for Quill documentation generation
 */
export class MainAgent {
  private config: QuillConfig;
  private playwright: PlaywrightMCP;
  private crawler?: WebCrawlerAgent;
  private documentGenerator?: DocumentGenerator;
  private sessionManager?: SessionManager;
  private loginAgent?: LoginAgent;
  private credentialProvider?: CredentialProvider;

  constructor(config: QuillConfig) {
    this.config = config;
    this.playwright = new PlaywrightMCP({
      headless: true,
      timeout: 30000,
    });
    this.documentGenerator = new DocumentGenerator({
      title: `${new URL(config.url).hostname} Documentation`,
      includeDescriptions: true,
      includeElements: true,
    });

    // Initialize authentication components if auth is configured
    if (config.auth) {
      this.sessionManager = new SessionManager();
      this.credentialProvider = new CredentialProvider();
    }
  }

  /**
   * Execute the documentation generation workflow
   */
  async execute(): Promise<AgentResult<PageInfo[]>> {
    try {
      logger.info('Starting documentation generation workflow...');

      // 1. Initialize Playwright browser
      const initResult = await this.playwright.init();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      // 2. Handle authentication if configured
      if (this.config.auth) {
        const authResult = await this.handleAuthentication();
        if (!authResult.success) {
          throw new Error(authResult.error || 'Authentication failed');
        }
      }

      // 3. Create web crawler agent
      this.crawler = new WebCrawlerAgent(this.playwright, {
        maxDepth: this.config.depth ?? 2,
        maxPages: this.config.options?.maxPages ?? 50,
        outputDir: this.config.output ?? './output/screenshots',
      });

      // 4. Crawl pages
      const crawlResult = await this.crawler.crawl(this.config.url);
      if (!crawlResult.success || !crawlResult.data) {
        throw new Error(crawlResult.error || 'Crawl failed');
      }

      const pages = crawlResult.data;

      logger.success(`Documentation generation complete. Collected ${pages.length} pages.`);

      return {
        success: true,
        data: pages,
        metadata: {
          config: this.config,
          pageCount: pages.length,
        },
      };
    } catch (error) {
      logger.error('Documentation generation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      // Always close browser
      await this.playwright.close();
    }
  }

  /**
   * Get collected pages
   */
  getPages(): PageInfo[] {
    return this.crawler?.getResults() ?? [];
  }

  /**
   * Generate document from collected pages
   */
  generateDocument(pages: PageInfo[]): AgentResult<Document> {
    if (!this.documentGenerator) {
      return {
        success: false,
        error: 'Document generator not initialized',
      };
    }

    return this.documentGenerator.generate(pages);
  }

  /**
   * Handle authentication workflow
   */
  private async handleAuthentication(): Promise<AgentResult<void>> {
    try {
      const authConfig = this.config.auth!;
      const sessionPath = authConfig.sessionPath || './session.json';

      logger.info('Checking authentication...');

      // 1. Try to load existing session
      if (this.sessionManager) {
        const sessionExists = await this.sessionManager.exists(sessionPath);

        if (sessionExists) {
          logger.info('Loading existing session...');
          const loadResult = await this.sessionManager.load(sessionPath);

          if (loadResult.success && loadResult.data) {
            const isValid = await this.sessionManager.isValid(loadResult.data);

            if (isValid) {
              logger.success('Valid session found, applying to browser context');
              await this.applySessionState(loadResult.data);
              return { success: true };
            } else {
              logger.warn('Session expired, will perform fresh login');
            }
          }
        } else {
          logger.info('No existing session found, will perform login');
        }
      }

      // 2. Perform login if no valid session
      logger.info('Performing authentication...');

      // Get credentials
      if (!this.credentialProvider) {
        throw new Error('Credential provider not initialized');
      }

      const credResult = await this.credentialProvider.getCredentials(authConfig);
      if (!credResult.success || !credResult.data) {
        throw new Error(credResult.error || 'Failed to get credentials');
      }

      const credentials = credResult.data;

      // Validate credentials
      if (!this.credentialProvider.validateCredentials(credentials)) {
        throw new Error('Invalid credentials provided');
      }

      // Initialize login agent
      const loginUrl = authConfig.loginUrl || this.config.url;
      this.loginAgent = new LoginAgent(this.playwright, {
        loginUrl,
        timeout: authConfig.timeout,
      });

      // Perform login
      const loginResult = await this.loginAgent.login(credentials);
      if (!loginResult.success || !loginResult.data) {
        throw new Error(loginResult.error || 'Login failed');
      }

      const sessionState = loginResult.data;

      // Save session for future use
      if (this.sessionManager) {
        await this.sessionManager.save(sessionPath, sessionState);
      }

      logger.success('Authentication successful');

      return { success: true };
    } catch (error) {
      logger.error('Authentication failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Apply session state to Playwright context
   */
  private async applySessionState(sessionState: any): Promise<void> {
    const context = this.playwright['context'];
    if (!context) {
      throw new Error('Playwright context not initialized');
    }

    // Close current context and create new one with session state
    await context.close();

    const browser = this.playwright['browser'];
    if (!browser) {
      throw new Error('Playwright browser not initialized');
    }

    const newContext = await browser.newContext({
      storageState: sessionState,
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const newPage = await newContext.newPage();
    newPage.setDefaultTimeout(30000);

    // Update playwright instance
    this.playwright['context'] = newContext;
    this.playwright['page'] = newPage;
  }
}
