/**
 * Init command - Initialize Quill configuration
 */

import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_CONFIG = `# Quill Configuration

target:
  url: http://localhost:3000
  depth: 2

auth:
  type: session
  # login_url: /auth/login

output:
  format: markdown
  path: ./manuals
  language: en

options:
  include_toc: true
  include_screenshots: true
  screenshot_quality: high
  max_pages: 50
`;

/**
 * Initialize Quill configuration file
 */
export async function initCommand(): Promise<void> {
  const spinner = ora('Initializing Quill configuration...').start();

  try {
    const configPath = path.join(process.cwd(), 'quill.config.yaml');

    // Check if config already exists
    try {
      await fs.access(configPath);
      spinner.fail(chalk.yellow('Configuration file already exists: quill.config.yaml'));
      return;
    } catch {
      // Config doesn't exist, create it
    }

    // Write default config
    await fs.writeFile(configPath, DEFAULT_CONFIG, 'utf-8');

    spinner.succeed(chalk.green('Configuration file created: quill.config.yaml'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log('  1. Edit quill.config.yaml to configure your target URL');
    console.log('  2. Run: quill generate --config quill.config.yaml');
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize configuration'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    throw error;
  }
}
