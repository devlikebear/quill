/**
 * Generate command - Generate documentation from a web application
 */

import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync } from 'fs';
import type { QuillConfig, OutputFormat } from '../../types/index.js';
import { MainAgent } from '../../agent/main-agent.js';
import { DocumentGenerator } from '../../agent/subagents/document-generator.js';
import { MarkdownFormatter } from '../../output/formatters/markdown.js';
import { saveTextFile, saveJsonFile } from '../../utils/file-utils.js';
import { generateMultiFile } from '../../generators/multi-file-generator.js';
import path from 'path';

interface GenerateOptions {
  url?: string;
  depth?: string;
  format?: OutputFormat;
  output?: string;
  language?: string;
  config?: string;
  template?: string;
  multiFile?: boolean;
  customTemplateDir?: string;
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
    // Load config file if specified
    let fileConfig = {};
    if (options.config) {
      if (existsSync(options.config)) {
        const configContent = readFileSync(options.config, 'utf-8');
        fileConfig = JSON.parse(configContent);
        spinner.text = `Configuration loaded from ${options.config}`;
      } else {
        spinner.warn(chalk.yellow(`Config file not found: ${options.config}`));
      }
    }

    // Merge options: CLI args > config file > defaults
    const mergedOptions = { ...fileConfig, ...options };

    // Validate required options
    if (!mergedOptions.url) {
      spinner.fail(chalk.red('URL is required. Use --url <url> or provide it in config file'));
      return;
    }

    // Build configuration
    const config: QuillConfig = {
      url: mergedOptions.url,
      depth: mergedOptions.depth ? parseInt(mergedOptions.depth, 10) : 2,
      format: mergedOptions.format ?? 'markdown',
      output: mergedOptions.output ?? './manual',
      language: mergedOptions.language ?? 'en',
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

    // Check if multi-file mode
    if (mergedOptions.multiFile) {
      // Multi-file documentation generation
      spinner.start('Generating multi-file documentation...');

      const baseUrl = new URL(config.url);
      const generationResult = await generateMultiFile(pages, {
        template: mergedOptions.template || 'user-guide',
        outputDir: config.output!,
        baseUrl: `${baseUrl.protocol}//${baseUrl.host}`,
        customTemplateDir: mergedOptions.customTemplateDir,
      });

      spinner.succeed(chalk.green('Multi-file documentation generated!'));

      // Display results
      console.log(chalk.cyan(`\n✅ Multi-File Documentation Generated:\n`));
      console.log(chalk.green(`  📁 Output Directory: ${generationResult.outputDir}`));
      console.log(chalk.gray(`  📄 Files Generated: ${generationResult.filesGenerated}`));
      console.log(chalk.gray(`  📋 Template: ${generationResult.templateName}`));
      console.log(chalk.gray(`  📊 Pages: ${generationResult.metadata.pageCount}`));
      console.log(chalk.gray(`  🎯 Features: ${generationResult.metadata.featureCount}\n`));

      // Display sample files
      console.log(chalk.cyan('📄 Generated files (sample):'));
      generationResult.files.slice(0, 10).forEach((file, index) => {
        const relativePath = path.relative(generationResult.outputDir, file);
        console.log(chalk.gray(`  ${index + 1}. ${relativePath}`));
      });

      if (generationResult.files.length > 10) {
        console.log(chalk.gray(`  ... and ${generationResult.files.length - 10} more files\n`));
      }

      return;
    }

    // Single-file documentation generation (existing logic)
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

    // Copy screenshots from Playwright MCP to output directory
    spinner.start('Copying screenshots...');
    try {
      const fs = await import('fs/promises');
      const playwrightScreenshotsDir = '.playwright-mcp/screenshots';
      const outputScreenshotsDir = path.join(outputDir, 'screenshots');

      // Create output screenshots directory
      await fs.mkdir(outputScreenshotsDir, { recursive: true });

      // Copy all PNG files from Playwright MCP screenshots
      try {
        const files = await fs.readdir(playwrightScreenshotsDir);
        const pngFiles = files.filter((f) => f.endsWith('.png'));

        for (const file of pngFiles) {
          const srcPath = path.join(playwrightScreenshotsDir, file);
          const destPath = path.join(outputScreenshotsDir, file);
          await fs.copyFile(srcPath, destPath);
        }

        spinner.succeed(chalk.green(`Screenshots copied! (${pngFiles.length} files)`));
      } catch (err) {
        // If no screenshots directory exists, that's okay
        spinner.info(chalk.yellow('No screenshots found to copy'));
      }
    } catch (error) {
      spinner.warn(chalk.yellow('Failed to copy screenshots'));
    }

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
