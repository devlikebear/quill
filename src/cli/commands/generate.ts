/**
 * Generate command - Generate documentation from a web application
 */

import chalk from 'chalk';
import ora from 'ora';
import type { QuillConfig, OutputFormat } from '../../types/index.js';
import { MainAgent } from '../../agent/main-agent.js';
import { DocumentGenerator } from '../../agent/subagents/document-generator.js';
import { MarkdownFormatter } from '../../output/formatters/markdown.js';
import { saveTextFile, saveJsonFile } from '../../utils/file-utils.js';
import path from 'path';

interface GenerateOptions {
  url?: string;
  depth?: string;
  format?: OutputFormat;
  output?: string;
  language?: string;
  config?: string;
  // Authentication options
  authType?: 'session' | 'basic' | 'oauth';
  loginUrl?: string;
  sessionPath?: string;
  authInteractive?: boolean;
  username?: string;
  password?: string;
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

    // Add authentication configuration if provided
    if (options.authType) {
      config.auth = {
        type: options.authType,
        loginUrl: options.loginUrl,
        sessionPath: options.sessionPath ?? './session.json',
        interactive: options.authInteractive,
        username: options.username,
        password: options.password,
      };
    }

    spinner.text = 'Configuration loaded';
    spinner.succeed();

    console.log(chalk.cyan('\n📋 Configuration:'));
    console.log(chalk.gray(`  URL: ${config.url}`));
    console.log(chalk.gray(`  Depth: ${config.depth}`));
    console.log(chalk.gray(`  Format: ${config.format}`));
    console.log(chalk.gray(`  Output: ${config.output}`));

    if (config.auth) {
      console.log(chalk.gray(`  Auth Type: ${config.auth.type}`));
      if (config.auth.loginUrl) {
        console.log(chalk.gray(`  Login URL: ${config.auth.loginUrl}`));
      }
      if (config.auth.sessionPath) {
        console.log(chalk.gray(`  Session Path: ${config.auth.sessionPath}`));
      }
      if (config.auth.username) {
        console.log(chalk.gray(`  Username: ${config.auth.username}`));
      }
      if (config.auth.interactive) {
        console.log(chalk.gray(`  Interactive Mode: enabled`));
      }
    }

    console.log('');

    // Create main agent
    const agent = new MainAgent(config);

    spinner.start('Starting documentation generation...');

    // Execute workflow
    const result = await agent.execute();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Generation failed');
    }

    const pages = result.data;

    spinner.succeed(chalk.green(`Web crawling complete!`));

    // Display crawl results
    console.log(chalk.cyan(`\n📊 Crawl Results:`));
    console.log(chalk.gray(`  Pages crawled: ${pages.length}`));
    console.log(chalk.gray(`  Screenshots saved: ${config.output}/screenshots\n`));

    // Generate document
    spinner.start('Generating documentation...');

    const documentGenerator = new DocumentGenerator({
      title: `${new URL(config.url).hostname} Documentation`,
      includeDescriptions: true,
      includeElements: true,
    });

    const docResult = documentGenerator.generate(pages);
    if (!docResult.success || !docResult.data) {
      throw new Error(docResult.error || 'Document generation failed');
    }

    const document = docResult.data;
    spinner.succeed(chalk.green('Document structure generated!'));

    // Format document based on selected format
    spinner.start('Formatting document...');

    const outputDir = config.output ?? './output';
    const dataPath = path.join(outputDir, 'pages.json');
    let docPath: string;
    let outputContent: string | Buffer;

    const formatterOptions = {
      includeToc: true,
      includeScreenshots: true,
      includeElements: true,
    };

    switch (config.format) {
      case 'markdown': {
        const formatter = new MarkdownFormatter();
        outputContent = formatter.format(document, formatterOptions);
        docPath = path.join(outputDir, 'documentation.md');
        break;
      }

      case 'docx': {
        const { DocxFormatter } = await import('../../output/formatters/docx.js');
        const formatter = new DocxFormatter();
        outputContent = await formatter.format(document, formatterOptions);
        docPath = path.join(outputDir, 'documentation.docx');
        break;
      }

      case 'html': {
        const { HtmlFormatter } = await import('../../output/formatters/html.js');
        const formatter = new HtmlFormatter();
        outputContent = formatter.format(document, formatterOptions);
        docPath = path.join(outputDir, 'documentation.html');
        break;
      }

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    spinner.succeed(chalk.green('Document formatted!'));

    // Save files
    spinner.start('Saving files...');

    await saveJsonFile(dataPath, pages);

    // Save formatted document (handle both string and Buffer)
    if (Buffer.isBuffer(outputContent)) {
      const fs = await import('fs/promises');
      await fs.writeFile(docPath, outputContent);
    } else {
      await saveTextFile(docPath, outputContent);
    }

    spinner.succeed(chalk.green('Files saved!'));

    // Display results
    console.log(chalk.cyan(`\n✅ Documentation Generated:\n`));
    console.log(chalk.green(`  📄 ${config.format.toUpperCase()}: ${docPath}`));
    console.log(chalk.gray(`  📊 Data: ${dataPath}`));
    console.log(chalk.gray(`  📸 Screenshots: ${config.output}/screenshots\n`));

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
