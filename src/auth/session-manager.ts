/**
 * Session Manager - Manages Playwright session state persistence
 */

import type { SessionState, AgentResult } from '../types/index.js';
import { fileExists, readTextFile, saveJsonFile } from '../utils/file-utils.js';
import { logger } from '../utils/logger.js';

/**
 * Session Manager for handling authentication state
 */
export class SessionManager {
  /**
   * Load session state from file
   */
  async load(sessionPath: string): Promise<AgentResult<SessionState>> {
    try {
      const exists = await fileExists(sessionPath);

      if (!exists) {
        logger.debug(`Session file not found: ${sessionPath}`);
        return {
          success: false,
          error: 'Session file not found',
        };
      }

      const content = await readTextFile(sessionPath);
      const sessionState: SessionState = JSON.parse(content);

      logger.success(`Session loaded from: ${sessionPath}`);

      return {
        success: true,
        data: sessionState,
      };
    } catch (error) {
      logger.error(`Failed to load session from ${sessionPath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save session state to file
   */
  async save(sessionPath: string, state: SessionState): Promise<AgentResult<void>> {
    try {
      await saveJsonFile(sessionPath, state);

      logger.success(`Session saved to: ${sessionPath}`);

      return {
        success: true,
      };
    } catch (error) {
      logger.error(`Failed to save session to ${sessionPath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate session state
   */
  async isValid(state: SessionState): Promise<boolean> {
    try {
      // Check if session state has required structure
      if (!state || !state.cookies || !Array.isArray(state.cookies)) {
        logger.debug('Invalid session structure');
        return false;
      }

      // Check if cookies are expired
      const now = Date.now() / 1000; // Convert to seconds
      const validCookies = state.cookies.filter((cookie) => {
        // If expires is -1, it's a session cookie (valid)
        if (cookie.expires === -1) {
          return true;
        }
        // Check if cookie is not expired
        return cookie.expires > now;
      });

      if (validCookies.length === 0) {
        logger.debug('All cookies expired');
        return false;
      }

      logger.debug(`Session has ${validCookies.length}/${state.cookies.length} valid cookies`);
      return true;
    } catch (error) {
      logger.error('Error validating session', error);
      return false;
    }
  }

  /**
   * Clear session file
   */
  async clear(sessionPath: string): Promise<AgentResult<void>> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(sessionPath);

      logger.success(`Session cleared: ${sessionPath}`);

      return {
        success: true,
      };
    } catch (error) {
      // If file doesn't exist, that's okay
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          success: true,
        };
      }

      logger.error(`Failed to clear session: ${sessionPath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if session file exists
   */
  async exists(sessionPath: string): Promise<boolean> {
    return await fileExists(sessionPath);
  }

  /**
   * Get session info (cookie count, expiry, etc.)
   */
  async getInfo(sessionPath: string): Promise<
    AgentResult<{
      cookieCount: number;
      validCookies: number;
      oldestExpiry?: Date;
    }>
  > {
    const loadResult = await this.load(sessionPath);

    if (!loadResult.success || !loadResult.data) {
      return {
        success: false,
        error: loadResult.error,
      };
    }

    const state = loadResult.data;
    const now = Date.now() / 1000;

    const validCookies = state.cookies.filter((cookie) => {
      if (cookie.expires === -1) return true;
      return cookie.expires > now;
    });

    const expiryTimes = state.cookies
      .filter((c) => c.expires !== -1)
      .map((c) => c.expires)
      .sort((a, b) => a - b);

    return {
      success: true,
      data: {
        cookieCount: state.cookies.length,
        validCookies: validCookies.length,
        oldestExpiry:
          expiryTimes.length > 0 && expiryTimes[0] ? new Date(expiryTimes[0] * 1000) : undefined,
      },
    };
  }
}
