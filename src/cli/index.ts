/**
 * Quill CLI - Command Line Interface
 */

import { config } from 'dotenv';
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';
import { updateCommand } from './commands/update.js';

// Load environment variables from .env file
config();

const program = new Command();

program
  .name('quill')
  .description('AI-powered documentation generator for web applications')
  .version('1.0.0');

// Init command
program.command('init').description('Initialize Quill configuration').action(initCommand);

// Generate command
program
  .command('generate')
  .description('Generate documentation from a web application')
  .option('--url <url>', 'Target URL to document')
  .option('--depth <number>', 'Crawling depth', '2')
  .option('--format <format>', 'Output format (docx|markdown|html|pdf)', 'markdown')
  .option('--output <path>', 'Output file path', './manual')
  .option('--language <lang>', 'Documentation language', 'en')
  .option('--template <name>', 'Template to use (user-guide|technical|quick-start)', 'user-guide')
  .option('--multi-file', 'Generate multi-file documentation (default: single file)')
  .option('--custom-template-dir <path>', 'Directory containing custom templates')
  .option('--config <path>', 'Path to .quillrc.json configuration file')
  .option('--auth-type <type>', 'Authentication type (session|basic|oauth)')
  .option('--login-url <url>', 'Login page URL (for session-based auth)')
  .option('--session-path <path>', 'Path to save/load session state', './session.json')
  .option('--auth-interactive', 'Interactive authentication mode (prompts for credentials)')
  .option('--username <username>', 'Username for authentication')
  .option('--password <password>', 'Password for authentication')
  .action(generateCommand);

// Update command
program
  .command('update')
  .description('Update specific page(s) in existing documentation')
  .requiredOption('--page <url>', 'Page URL to update')
  .requiredOption('--output-dir <path>', 'Documentation output directory')
  .option('--url <url>', 'Base URL (auto-detected if not specified)')
  .option('--template <name>', 'Template to use (default: user-guide)')
  .action(updateCommand);

// Global error handler
program.exitOverride((err) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});

// Parse arguments
program.parse();
