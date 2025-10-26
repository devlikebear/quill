/**
 * Credentials Utility - Anthropic authentication management
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AnthropicCredentials {
  type: 'api-key' | 'claude-code';
  value: string;
}

/**
 * Load Anthropic credentials with priority:
 * 1. ANTHROPIC_API_KEY (highest priority)
 * 2. Claude Code credentials.json
 * 3. Error (no credentials found)
 */
export function loadAnthropicCredentials(): AnthropicCredentials {
  // 1. Check API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey.trim()) {
    return {
      type: 'api-key',
      value: apiKey.trim(),
    };
  }

  // 2. Check Claude Code credentials
  const anthropicHome =
    process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
  const credentialsPath = path.join(anthropicHome, 'credentials.json');

  if (fs.existsSync(credentialsPath)) {
    try {
      const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8');
      const credentials = JSON.parse(credentialsContent);

      if (credentials.sessionKey && typeof credentials.sessionKey === 'string') {
        return {
          type: 'claude-code',
          value: credentials.sessionKey,
        };
      }
    } catch (error) {
      console.warn('Failed to load Claude Code credentials:', error);
    }
  }

  // 3. No credentials found
  throw new Error(
    'No Anthropic credentials found.\n' +
      'Please set ANTHROPIC_API_KEY environment variable or ensure Claude Code is installed.\n' +
      'See .env.example for configuration options.'
  );
}

/**
 * Validate credentials format
 */
export function validateCredentials(credentials: AnthropicCredentials): boolean {
  if (!credentials.value || credentials.value.trim() === '') {
    return false;
  }

  if (credentials.type === 'api-key') {
    // API 키는 sk-ant-로 시작해야 함
    return credentials.value.startsWith('sk-ant-');
  }

  // Claude Code session key는 길이만 확인
  return credentials.value.length > 20;
}

/**
 * Get credentials path for debugging
 */
export function getCredentialsPath(): string {
  const anthropicHome =
    process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
  return path.join(anthropicHome, 'credentials.json');
}
