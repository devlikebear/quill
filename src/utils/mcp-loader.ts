/**
 * MCP Server Loader - Load MCP server configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface McpServerConfig {
  type: 'stdio';
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpServers {
  [name: string]: McpServerConfig;
}

/**
 * Load MCP servers from ~/.claude/mcp-servers.json
 */
export function loadMcpServers(): McpServers {
  try {
    const anthropicHome =
      process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
    const mcpConfigPath = path.join(anthropicHome, 'mcp-servers.json');

    if (!fs.existsSync(mcpConfigPath)) {
      console.warn(`MCP config not found: ${mcpConfigPath}`);
      console.warn('Running without MCP servers.');
      console.warn(
        'To use Playwright MCP, create ~/.claude/mcp-servers.json (see mcp-servers.example.json)'
      );
      return {};
    }

    const mcpConfigContent = fs.readFileSync(mcpConfigPath, 'utf-8');
    const mcpConfig = JSON.parse(mcpConfigContent);

    // Support both formats: { mcpServers: {...} } and { servers: {...} }
    const serversObj = mcpConfig.mcpServers || mcpConfig.servers || {};

    const enabledServersStr = process.env.ENABLED_MCP_SERVERS || 'playwright';
    const enabledServers = enabledServersStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (enabledServers.length === 0) {
      console.warn('No MCP servers enabled (ENABLED_MCP_SERVERS is empty)');
      return {};
    }

    const mcpServers: McpServers = {};
    for (const name of enabledServers) {
      if (serversObj[name]) {
        mcpServers[name] = {
          type: 'stdio',
          command: serversObj[name].command,
          args: serversObj[name].args,
          ...(serversObj[name].env && { env: serversObj[name].env }),
        };
      } else {
        console.warn(`MCP server '${name}' not found in config`);
      }
    }

    if (Object.keys(mcpServers).length > 0) {
      console.log('MCP servers loaded:', Object.keys(mcpServers).join(', '));
    } else {
      console.warn('No MCP servers could be loaded');
    }

    return mcpServers;
  } catch (error) {
    console.error('Failed to load MCP servers:', error);
    console.error('Continuing without MCP servers...');
    return {};
  }
}

/**
 * Get MCP config path for debugging
 */
export function getMcpConfigPath(): string {
  const anthropicHome =
    process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
  return path.join(anthropicHome, 'mcp-servers.json');
}
