/**
 * Credential Provider - Manages credential retrieval from various sources
 */

import type { Credentials, AuthConfig, AgentResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Credential Provider for retrieving authentication credentials
 */
export class CredentialProvider {
  /**
   * Get credentials from configuration, environment, or prompt
   */
  async getCredentials(config: AuthConfig): Promise<AgentResult<Credentials>> {
    try {
      // 1. Try to get from config (highest priority)
      const fromConfig = this.loadFromConfig(config);
      if (fromConfig) {
        logger.debug('Credentials loaded from configuration');
        return {
          success: true,
          data: fromConfig,
        };
      }

      // 2. Try to get from environment variables
      const fromEnv = this.loadFromEnv();
      if (fromEnv) {
        logger.debug('Credentials loaded from environment variables');
        return {
          success: true,
          data: fromEnv,
        };
      }

      // 3. If interactive mode, prompt user
      if (config.interactive) {
        logger.info('Interactive mode: prompting for credentials');
        const prompted = await this.promptUser();
        return {
          success: true,
          data: prompted,
        };
      }

      // No credentials found
      return {
        success: false,
        error:
          'No credentials provided. Use --auth-interactive or set QUILL_USERNAME/QUILL_PASSWORD',
      };
    } catch (error) {
      logger.error('Failed to get credentials', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Load credentials from config
   */
  private loadFromConfig(config: AuthConfig): Credentials | null {
    if (config.username && config.password) {
      return {
        username: config.username,
        password: config.password,
      };
    }
    return null;
  }

  /**
   * Load credentials from environment variables
   */
  private loadFromEnv(): Credentials | null {
    const username = process.env.QUILL_USERNAME;
    const password = process.env.QUILL_PASSWORD;

    if (username && password) {
      return {
        username,
        password,
      };
    }

    return null;
  }

  /**
   * Prompt user for credentials (interactive mode)
   */
  private async promptUser(): Promise<Credentials> {
    // For now, this is a simplified implementation
    // In a real CLI, you would use a library like 'inquirer' or 'prompts'
    // to securely prompt for password input

    const readline = await import('readline/promises');
    const { stdin: input, stdout: output } = process;

    const rl = readline.createInterface({ input, output });

    try {
      const username = await rl.question('Username: ');
      const password = await rl.question('Password: ');

      return {
        username: username.trim(),
        password: password.trim(),
      };
    } finally {
      rl.close();
    }
  }

  /**
   * Validate credentials
   */
  validateCredentials(credentials: Credentials): boolean {
    return !!(
      credentials &&
      credentials.username &&
      credentials.username.trim().length > 0 &&
      credentials.password &&
      credentials.password.trim().length > 0
    );
  }
}
