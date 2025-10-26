/**
 * File utility functions for Quill
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error(`Failed to create directory: ${dirPath}`, error);
    throw error;
  }
}

/**
 * Save text content to file
 */
export async function saveTextFile(filePath: string, content: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await ensureDirectory(dir);
    await fs.writeFile(filePath, content, 'utf-8');
    logger.debug(`File saved: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to save file: ${filePath}`, error);
    throw error;
  }
}

/**
 * Save JSON data to file
 */
export async function saveJsonFile(filePath: string, data: unknown): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await saveTextFile(filePath, content);
  } catch (error) {
    logger.error(`Failed to save JSON file: ${filePath}`, error);
    throw error;
  }
}

/**
 * Read text file
 */
export async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    logger.error(`Failed to read file: ${filePath}`, error);
    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Convert absolute path to relative path from a base directory
 */
export function toRelativePath(absolutePath: string, baseDir: string): string {
  return path.relative(baseDir, absolutePath);
}

/**
 * Sanitize filename by removing invalid characters
 */
export function sanitizeFilename(filename: string): string {
  // Replace invalid characters with hyphen
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get file extension
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Join paths safely
 */
export function joinPaths(...paths: string[]): string {
  return path.join(...paths);
}
