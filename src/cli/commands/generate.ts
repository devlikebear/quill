/**
 * Generate command - Generate documentation from a web application
 */

import chalk from 'chalk';
import ora from 'ora';
import type { QuillConfig, OutputFormat } from '../../types/index.js';
import { MainAgent } from '../../agent/main-agent.js';
import fs from 'fs/promises';
import path from 'path';

interface GenerateOptions {
  url?: string;
  depth?: string;
  format?: OutputFormat;
  output?: string;
  language?: string;
  config?: string;
}

/**
 * Generate documentation from a web application
 */
export async function generateCommand(options: GenerateOptions): Promise<void> {
  const spinner = ora('Initializing...').start();

  try {
    // Validate required options
    if (!options.url) {
      spinner.fail(chalk.red('URL is required. Use --url <url>'));
      return;
    }

    // Build configuration
    const config: QuillConfig = {
      url: options.url,
      depth: options.depth ? parseInt(options.depth, 10) : 2,
      format: options.format ?? 'markdown',
      output: options.output ?? './output',
      language: options.language ?? 'en',
    };

    spinner.text = 'Configuration loaded';
    spinner.succeed();

    console.log(chalk.cyan('\n📋 Configuration:'));
    console.log(chalk.gray(`  URL: ${config.url}`));
    console.log(chalk.gray(`  Depth: ${config.depth}`));
    console.log(chalk.gray(`  Format: ${config.format}`));
    console.log(chalk.gray(`  Output: ${config.output}\n`));

    // Create main agent
    const agent = new MainAgent(config);

    spinner.start('Starting documentation generation...');

    // Execute workflow
    const result = await agent.execute();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Generation failed');
    }

    const pages = result.data;

    spinner.succeed(chalk.green(`Documentation generation complete!`));

    // Display results
    console.log(chalk.cyan(`\n📊 Results:`));
    console.log(chalk.gray(`  Pages crawled: ${pages.length}`));
    console.log(chalk.gray(`  Screenshots saved: ${config.output}/screenshots\n`));

    // Save page data
    const outputDir = config.output ?? './output';
    await fs.mkdir(outputDir, { recursive: true });

    const dataPath = path.join(outputDir, 'pages.json');
    await fs.writeFile(dataPath, JSON.stringify(pages, null, 2));

    console.log(chalk.green(`✅ Page data saved: ${dataPath}\n`));

    // Display sample pages
    console.log(chalk.cyan('📄 Sample pages:'));
    pages.slice(0, 5).forEach((page, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${page.title} - ${page.url}`));
    });

    if (pages.length > 5) {
      console.log(chalk.gray(`  ... and ${pages.length - 5} more pages\n`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate documentation'));
    if (error instanceof Error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }
    process.exit(1);
  }
}
