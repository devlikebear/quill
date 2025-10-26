# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2024-10-26

### Added
- **Document Generator Agent**: Converts page data into structured documents
  - Automatic document metadata generation
  - Table of contents (TOC) builder
  - Section builder from page information
  - Support for descriptions and UI elements
  - Anchor link generation for navigation
- **Markdown Formatter**: Converts documents to Markdown format
  - Document title and metadata formatting
  - Table of contents with nested items
  - Section formatting with headers and anchors
  - Screenshot image links (relative paths)
  - UI element lists with descriptions
  - Markdown special character escaping
- **Base Formatter Interface**: Abstract formatter for future format support
  - Common utility methods (escapeText, generateAnchor, formatDate)
  - Extensible design for additional formats (DOCX, HTML, PDF)
- **File Utilities**: Helper functions for file operations
  - Directory creation with recursive support
  - Text and JSON file saving
  - File existence checking
  - Filename sanitization and generation
  - Relative path conversion
- **Type Definitions**:
  - Document, Section, TOC, TOCItem interfaces
  - DocumentMetadata and FormatterOptions
  - Comprehensive type support for document generation

### Changed
- Main agent now includes document generation workflow
- CLI `generate` command produces Markdown documentation files
- Enhanced output with document structure and formatting
- Better separation of concerns (crawling → generation → formatting)

### Technical Details
- Implemented document structure with metadata and sections
- Added Markdown formatter with proper escaping and formatting
- File utilities for safe file operations
- Document generator creates structured output from raw page data
- Output includes both raw data (JSON) and formatted documentation (Markdown)

## [0.2.0] - 2024-10-26

### Added
- **Playwright Integration**: Direct Playwright integration for browser automation
  - Browser instance management (Chromium)
  - Page navigation and interaction
  - Screenshot capture with full-page support
  - Link extraction and absolute URL conversion
  - UI element detection (buttons, inputs, links)
  - Page metadata collection (title, description)
- **Web Crawler Agent**: BFS-based page crawling implementation
  - Depth-limited crawling algorithm
  - Same-domain URL filtering
  - Visited page tracking to prevent duplicates
  - Queue-based URL management
  - Progress monitoring and logging
- **Utility Functions**:
  - Logger with color-coded output (debug, info, warn, error)
  - URL utilities (normalization, validation, domain checking, filename generation)
- **CLI Improvements**:
  - `generate` command now fully functional
  - Progress indicators with ora spinner
  - Results display and statistics
  - Page data export to JSON
- **Documentation**:
  - Work plan for v0.2.0
  - Comprehensive code comments and JSDoc

### Changed
- Main agent now orchestrates web crawler workflow
- Generate command executes real browser automation
- Better error handling throughout the application
- Improved logging with timestamps and colors

### Technical Details
- Implemented BFS algorithm for web crawling
- Added graceful browser cleanup in finally block
- Page data serialization to JSON format
- Screenshot files saved with URL-based naming

## [0.1.0] - 2024-10-26

### Added
- Initial TypeScript project setup
- Basic CLI structure with `init` and `generate` commands
- Type definitions for core data structures
- Main agent orchestrator skeleton
- Playwright MCP integration foundation
- Project configuration files (tsconfig, eslint, prettier)
- Build tooling with tsup
- MIT License
- Basic project documentation

### Technical Stack
- TypeScript 5.3+
- Node.js 18+
- Commander.js for CLI
- Playwright for browser automation
- Claude Agent SDK integration (planned)

[Unreleased]: https://github.com/devlikebear/quill/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/devlikebear/quill/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/devlikebear/quill/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/devlikebear/quill/releases/tag/v0.1.0
