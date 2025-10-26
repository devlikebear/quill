#!/usr/bin/env node

/**
 * Quill CLI - Command Line Interface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';

const program = new Command();

program
  .name('quill')
  .description('AI-powered documentation generator for web applications')
  .version('0.1.0');

// Init command
program
  .command('init')
  .description('Initialize Quill configuration')
  .action(initCommand);

// Generate command
program
  .command('generate')
  .description('Generate documentation from a web application')
  .option('--url <url>', 'Target URL to document')
  .option('--depth <number>', 'Crawling depth', '2')
  .option('--format <format>', 'Output format (docx|markdown|html|pdf)', 'markdown')
  .option('--output <path>', 'Output file path', './manual')
  .option('--language <lang>', 'Documentation language', 'en')
  .action(generateCommand);

// Global error handler
program.exitOverride((err) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});

// Parse arguments
program.parse();
