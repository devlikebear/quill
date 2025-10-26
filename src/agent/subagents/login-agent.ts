/**
 * Login Agent - Automates login form submission
 */

import type {
  Credentials,
  LoginOptions,
  FormElements,
  SessionState,
  AgentResult,
} from '../../types/index.js';
import type { PlaywrightMCP } from '../../mcp/playwright.js';
import { logger } from '../../utils/logger.js';

/**
 * Login Agent for automated authentication
 */
export class LoginAgent {
  private playwright: PlaywrightMCP;
  private options: Required<LoginOptions>;

  constructor(playwright: PlaywrightMCP, options: LoginOptions) {
    this.playwright = playwright;
    this.options = {
      loginUrl: options.loginUrl,
      timeout: options.timeout ?? 30000,
      successPattern: options.successPattern ?? '',
      errorSelectors: options.errorSelectors ?? [
        '[role="alert"]',
        '.error',
        '.alert-danger',
        '#error',
      ],
    };
  }

  /**
   * Perform login and return session state
   */
  async login(credentials: Credentials): Promise<AgentResult<SessionState>> {
    try {
      logger.info(`Navigating to login page: ${this.options.loginUrl}`);

      // 1. Navigate to login page
      const navResult = await this.playwright.navigate(this.options.loginUrl);
      if (!navResult.success) {
        throw new Error(navResult.error || 'Failed to navigate to login page');
      }

      // Small delay to let page load
      await this.delay(1000);

      // 2. Detect login form
      logger.info('Detecting login form...');
      const formResult = await this.detectLoginForm();
      if (!formResult.success || !formResult.data) {
        throw new Error(formResult.error || 'Failed to detect login form');
      }

      const formElements = formResult.data;

      // 3. Fill credentials
      logger.info('Filling credentials...');
      const fillResult = await this.fillCredentials(formElements, credentials);
      if (!fillResult.success) {
        throw new Error(fillResult.error || 'Failed to fill credentials');
      }

      // 4. Submit form
      logger.info('Submitting login form...');
      const submitResult = await this.submitForm(formElements);
      if (!submitResult.success) {
        throw new Error(submitResult.error || 'Failed to submit form');
      }

      // Wait for navigation/response
      await this.delay(2000);

      // 5. Verify login success
      logger.info('Verifying login success...');
      const verifyResult = await this.verifyLoginSuccess();
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Login failed');
      }

      // 6. Get session state from Playwright
      logger.info('Retrieving session state...');
      const sessionState = await this.getSessionState();
      if (!sessionState.success || !sessionState.data) {
        throw new Error(sessionState.error || 'Failed to retrieve session state');
      }

      logger.success('Login successful!');

      return {
        success: true,
        data: sessionState.data,
      };
    } catch (error) {
      logger.error('Login failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Detect login form elements
   */
  private async detectLoginForm(): Promise<AgentResult<FormElements>> {
    try {
      const page = this.playwright['page'];
      if (!page) {
        throw new Error('Playwright page not initialized');
      }

      // Try to detect username field
      const usernameSelectors = [
        'input[name*="user" i]',
        'input[name*="login" i]',
        'input[name*="email" i]',
        'input[id*="user" i]',
        'input[id*="login" i]',
        'input[type="text"]',
        'input[type="email"]',
      ];

      let usernameSelector: string | undefined;
      for (const selector of usernameSelectors) {
        const element = await page.$(selector);
        if (element) {
          usernameSelector = selector;
          logger.debug(`Found username field: ${selector}`);
          break;
        }
      }

      // Try to detect password field
      const passwordSelector = 'input[type="password"]';
      const passwordElement = await page.$(passwordSelector);

      if (!passwordElement) {
        throw new Error('Password field not found');
      }

      logger.debug(`Found password field: ${passwordSelector}`);

      // Try to detect submit button
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
        '[role="button"]:has-text("Login")',
      ];

      let submitSelector: string | undefined;
      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            submitSelector = selector;
            logger.debug(`Found submit button: ${selector}`);
            break;
          }
        } catch {
          // Continue to next selector
        }
      }

      return {
        success: true,
        data: {
          usernameSelector,
          passwordSelector,
          submitSelector,
        },
      };
    } catch (error) {
      logger.error('Failed to detect login form', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fill login credentials
   */
  private async fillCredentials(
    form: FormElements,
    credentials: Credentials
  ): Promise<AgentResult<void>> {
    try {
      const page = this.playwright['page'];
      if (!page) {
        throw new Error('Playwright page not initialized');
      }

      // Fill username
      if (form.usernameSelector) {
        await page.fill(form.usernameSelector, credentials.username);
        logger.debug('Username filled');
      }

      // Fill password
      if (form.passwordSelector) {
        await page.fill(form.passwordSelector, credentials.password);
        logger.debug('Password filled');
      }

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to fill credentials', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Submit login form
   */
  private async submitForm(form: FormElements): Promise<AgentResult<void>> {
    try {
      const page = this.playwright['page'];
      if (!page) {
        throw new Error('Playwright page not initialized');
      }

      if (form.submitSelector) {
        await page.click(form.submitSelector);
      } else if (form.passwordSelector) {
        // Fallback: Press Enter on password field
        await page.press(form.passwordSelector, 'Enter');
      } else {
        throw new Error('No submit method found');
      }

      return {
        success: true,
      };
    } catch (error) {
      logger.error('Failed to submit form', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify login success
   */
  private async verifyLoginSuccess(): Promise<AgentResult<void>> {
    try {
      const page = this.playwright['page'];
      if (!page) {
        throw new Error('Playwright page not initialized');
      }

      // Check for error messages
      for (const errorSelector of this.options.errorSelectors) {
        const errorElement = await page.$(errorSelector);
        if (errorElement) {
          const errorText = await errorElement.textContent();
          throw new Error(`Login error: ${errorText || 'Unknown error'}`);
        }
      }

      // Check for URL change (successful redirect)
      const currentUrl = page.url();
      if (currentUrl !== this.options.loginUrl) {
        logger.debug(`URL changed from ${this.options.loginUrl} to ${currentUrl}`);
        return {
          success: true,
        };
      }

      // Check for success pattern if provided
      if (this.options.successPattern) {
        if (currentUrl.includes(this.options.successPattern)) {
          return {
            success: true,
          };
        }
      }

      // If we're still on the login page and no errors, assume success
      // (Some sites don't redirect)
      return {
        success: true,
      };
    } catch (error) {
      logger.error('Login verification failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get session state from Playwright context
   */
  private async getSessionState(): Promise<AgentResult<SessionState>> {
    try {
      const context = this.playwright['context'];
      if (!context) {
        throw new Error('Playwright context not initialized');
      }

      const state = await context.storageState();

      return {
        success: true,
        data: state as SessionState,
      };
    } catch (error) {
      logger.error('Failed to get session state', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
