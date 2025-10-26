# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-01-26

### 🎨 Feature Release: Template System & Multi-file Documentation

v1.1.0은 템플릿 시스템과 멀티파일 문서 생성 기능을 추가하여 더 유연하고 사용자 친화적인 문서를 생성할 수 있습니다.

### ✨ Added

- **템플릿 시스템** (`src/templates/`):
  - YAML 기반 템플릿 정의 시스템
  - Handlebars 템플릿 엔진 통합
  - 템플릿 로더 with 캐싱 및 검증
  - 3가지 빌트인 템플릿:
    - `user-guide`: 일반 사용자용 (functional style)
    - `technical`: 개발자용 (technical style)
    - `quick-start`: 빠른 시작용 (scenario-based style)
  - 커스텀 템플릿 지원 (`--custom-template-dir`)

- **멀티파일 생성** (`src/generators/`):
  - `MultiFileGenerator`: 구조화된 멀티파일 문서 생성
  - `SitemapGenerator`: 계층적 사이트맵 생성
  - `NavigationGenerator`: GNB/LNB/Breadcrumbs 생성
  - `FeatureExtractor`: UI 요소를 기능별로 그룹화
  - 출력 구조:
    - `docs/index.md` - 메인 랜딩 페이지
    - `docs/sitemap.md` - 전체 사이트맵
    - `docs/navigation/` - GNB/LNB 파일
    - `docs/pages/[id]/` - 페이지별 overview/instructions
    - `docs/features/` - 기능별 가이드

- **사용자 친화적 설명**:
  - 3가지 UI 요소 설명 스타일:
    - Technical: `button element (aria-label: submit)`
    - Functional: `Click "Submit" to save your changes` (기본)
    - Scenario-based: `When you want to save, click "Submit"`
  - 기능별 자동 그룹화 (Authentication, Search, Navigation 등)
  - AI 프롬프트 개선으로 사용자 관점 매뉴얼 생성

- **부분 업데이트** (`src/cli/commands/update.ts`):
  - `quill update` 명령어 추가
  - 특정 페이지만 선택적 업데이트
  - 기존 문서에서 페이지 정보 파싱
  - Base URL 자동 감지
  - 업데이트된 페이지와 기존 페이지 병합

- **설정 파일 지원**:
  - `.quillrc.json` 설정 파일 로딩
  - CLI 옵션 우선순위: CLI args > config file > defaults
  - JSON 형식으로 모든 옵션 지정 가능

- **Handlebars 헬퍼**:
  - `formatDate`: 날짜 포맷팅
  - `link`: 마크다운 링크 생성
  - `heading`: 마크다운 제목 생성
  - `code`: 코드 블록/인라인 코드 생성
  - `listItem`: 리스트 아이템 생성
  - 비교/유틸리티 헬퍼 (`eq`, `length`, `uppercase`, etc.)

### 🔄 Changed

- **Main Agent 프롬프트 개선**:
  - "web documentation expert" → "user-focused documentation expert"
  - 사용자 관점 설명 강조
  - 좋은/나쁜 예시 추가
  - 기능 그룹화 힌트 제공

- **CLI 명령어 개선**:
  - `generate` 명령어에 멀티파일 옵션 추가
  - `--multi-file`: 멀티파일 생성 활성화
  - `--template <name>`: 템플릿 선택
  - `--custom-template-dir <path>`: 커스텀 템플릿 디렉토리
  - `--config <path>`: 설정 파일 경로

- **Type 시스템 확장**:
  - `Feature`, `UIElementInfo` 인터페이스 추가
  - `SitemapStructure`, `NavigationStructure` 타입 추가
  - `UIElement`에 `ariaLabel` 필드 추가
  - 템플릿 관련 타입 정의 완비

### 📦 Dependencies

- **Added**:
  - `handlebars@^4.7.8`: 템플릿 렌더링
  - `js-yaml@^4.1.0`: YAML 파싱

### 📚 Documentation

- README.md 업데이트:
  - 템플릿 시스템 사용법 추가
  - 멀티파일 생성 예시 추가
  - update 명령어 문서화
  - CLI 옵션 업데이트
- TEMPLATES.md 추가:
  - 빌트인 템플릿 설명
  - 커스텀 템플릿 작성 가이드
  - Handlebars 헬퍼 레퍼런스
  - 템플릿 예제

### 🧪 Testing

- Template Loader 테스트 (10 tests)
- Feature Extractor 테스트 (9 tests)
- Multi-file Generation 통합 테스트 (9 tests)
- 총 28개 테스트 추가

### 📝 Migration Guide (v1.0.0 → v1.1.0)

**기존 방식 (단일 파일) 유지**:

```bash
quill generate --url https://example.com
# 기존처럼 단일 documentation.md 생성
```

**새로운 멀티파일 방식**:

```bash
quill generate --url https://example.com --multi-file --template user-guide
# 구조화된 멀티파일 문서 생성
```

**설정 파일 사용**:

```bash
# .quillrc.json
{
  "url": "https://example.com",
  "multiFile": true,
  "template": "user-guide"
}

quill generate --config .quillrc.json
```

## [1.0.0] - 2025-01-26

### 🎉 Major Release: Claude Agent SDK Migration

v1.0.0은 Quill의 완전한 재작성 버전입니다. Claude Agent SDK를 기반으로 구축되어 더 강력하고 안정적인 문서 생성 기능을 제공합니다.

### ⚠️ Breaking Changes

- **Claude Agent SDK 기반 재작성**: 기존 Playwright 직접 사용 방식에서 Claude Agent SDK의 `query()` 함수를 사용하는 방식으로 전환
- **Playwright MCP 전환**: Playwright를 직접 사용하지 않고 MCP (Model Context Protocol) 서버로 사용
- **이중 인증 방식 지원**: API Key와 Claude Code 구독 계정 모두 지원
- **환경 변수 변경**:
  - `ANTHROPIC_API_KEY` 사용 (API Key 방식)
  - `ANTHROPIC_HOME` 사용 (Claude Code 방식)
- **MCP 서버 설정 필요**: `~/.claude/mcp-servers.json` 파일 설정 필요

### ✨ Added

- **이중 인증 지원**: API Key와 Claude Code 구독 계정 방식 모두 지원
- **Credential Loader** (`src/utils/credentials.ts`): Anthropic 인증 정보 로딩 유틸리티
  - API Key 우선 순위 로딩
  - Claude Code credentials.json 지원
  - 인증 정보 검증 기능
- **MCP Loader** (`src/utils/mcp-loader.ts`): MCP 서버 설정 로딩 유틸리티
  - ~/.claude/mcp-servers.json 파일 로딩
  - ENABLED_MCP_SERVERS 환경 변수 지원
  - 서버별 활성화/비활성화 기능
- **설정 파일 템플릿**:
  - `.env.example`: 환경 변수 설정 예시
  - `mcp-servers.example.json`: MCP 서버 설정 예시
- **Agent SDK 옵션**: QuillConfig에 SDK 설정 필드 추가
  - `agentModel`: Claude 모델 선택 (기본: claude-opus-4-1-20250805)
  - `permissionMode`: 권한 모드 설정
  - `allowedTools`: 허용할 도구 목록
  - `mcpServers`: MCP 서버 설정 오버라이드

### 🔄 Changed

- **Main Agent 재작성** (`src/agent/main-agent.ts`):
  - Claude Agent SDK의 `query()` 함수 사용
  - 스트리밍 응답 처리 방식 개선
  - AI가 생성한 의미있는 UI 요소 설명 강조
  - System Prompt와 Task Prompt 분리
  - JSON 배열 형식의 구조화된 응답 처리
- **Document Generator 분리**: 문서 생성 로직을 별도 클래스로 분리
  - MainAgent는 크롤링만 담당
  - DocumentGenerator가 문서 구조 생성 담당
- **CLI 명령 업데이트**: SDK 기반 워크플로우에 맞게 조정
  - generate.ts에서 DocumentGenerator 직접 사용
  - 더 명확한 책임 분리

### 🗑️ Removed

- **Direct Playwright Usage**: `src/mcp/playwright.ts` 제거 (Playwright MCP로 대체)
- **Old Subagents**:
  - `src/agent/subagents/web-crawler.ts` (Agent SDK가 크롤링 처리)
  - `src/agent/subagents/login-agent.ts` (향후 재구현 예정)
- **Package Dependencies**:
  - `@anthropic-ai/sdk` 제거
  - `playwright` 제거 (MCP 서버로 대체)

### 📦 Dependencies

- **Added**: `@anthropic-ai/claude-agent-sdk@^0.1.27`
- **Removed**: `@anthropic-ai/sdk`, `playwright`

### 📚 Documentation

- README.md 전면 업데이트 (v1.0.0 기준)
- 인증 방식 가이드 추가 (API Key vs Claude Code)
- MCP 서버 설정 가이드 추가
- 환경 변수 설명 개선
- 마이그레이션 가이드 추가

### 🔧 Internal

- TypeScript 타입 정의 개선
- 빌드 프로세스 최적화
- 코드 구조 개선 및 불필요한 파일 제거
- Export 목록 정리 (index.ts)

### 📝 Migration Guide (v0.5.0 → v1.0.0)

**1. 환경 변수 업데이트**

```bash
# 이전 (.env)
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx

# 현재 (.env)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

**2. MCP 서버 설정**

`~/.claude/mcp-servers.json` 파일 생성:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**3. 의존성 재설치**

```bash
npm install
npm run build
```

## [0.5.0] - 2024-10-26

### Added

- **DOCX Output Format**: Generate professional Word documents
  - Full document structure with cover page and metadata
  - Automatic table of contents generation
  - Section formatting with headings and descriptions
  - Screenshot image embedding
  - UI elements as formatted tables
  - Professional styling (fonts, colors, spacing)
- **HTML Output Format**: Generate responsive web documents
  - Single-file HTML with embedded CSS and JavaScript
  - Fixed sidebar navigation with table of contents
  - Responsive design (mobile, tablet, desktop)
  - Smooth scrolling and active section highlighting
  - Print-optimized styles for PDF export
  - Dark theme-ready CSS variables
- **Format Selection**: CLI now supports multiple output formats
  - `--format markdown` for Markdown output (default)
  - `--format docx` for Word document output
  - `--format html` for HTML web document output
  - Dynamic formatter loading based on selected format
  - Automatic file extension handling

### Changed

- **BaseFormatter**: Updated to support Buffer output for binary formats
  - `format()` method now returns `string | Buffer | Promise<string | Buffer>`
  - Enables DOCX formatter to return binary Buffer
  - Maintains backward compatibility with string-based formatters
- **Generate Command**: Enhanced document generation workflow
  - Format-based formatter selection (Markdown, DOCX, HTML)
  - Dynamic import of formatters for better performance
  - Unified save logic for both text and binary formats
  - Improved output path handling with correct extensions

### Dependencies

- Added `docx@^9.5.1` for Word document generation

### Technical Details

- DOCX formatter uses `docx` library with async image embedding
- HTML formatter generates self-contained single-file documents
- CSS styling optimized for modern browsers and print media
- JavaScript for smooth scroll and TOC highlighting
- Image paths handled as relative references in HTML
- Buffer handling for binary DOCX format

## [0.4.0] - 2024-10-26

### Added
- **Authentication Support**: Complete authentication system for internal systems
  - Session-based authentication with login automation
  - Credential management (environment variables, config, interactive mode)
  - Session state persistence and reuse across runs
  - Automatic login form detection and submission
- **Session Manager**: Manages Playwright session state
  - Load and save session state from/to file
  - Session validation and expiry checking
  - Session information retrieval (cookie count, expiry)
- **Credential Provider**: Multiple credential sources
  - Environment variables (QUILL_USERNAME, QUILL_PASSWORD)
  - Configuration file credentials
  - Interactive mode with secure prompts
  - Credential validation
- **Login Agent**: Automated login form handling
  - Intelligent form field detection (username, password, submit)
  - Multiple selector strategies for compatibility
  - Login success verification
  - Error message detection
- **CLI Authentication Options**:
  - `--auth-type` for authentication method
  - `--login-url` for custom login pages
  - `--session-path` for session persistence
  - `--auth-interactive` for prompted credentials
  - `--username` and `--password` for direct credentials

### Changed
- Main agent now handles authentication workflow before crawling
- Playwright context can be initialized with stored session state
- Generate command displays authentication configuration
- Build configuration externalized Node.js built-in modules

### Technical Details
- Session state stored as JSON with cookie and localStorage data
- Login form detection uses multiple selector patterns
- Session validation checks cookie expiry timestamps
- Automatic session refresh on expiry
- Clean separation of auth concerns (SessionManager, CredentialProvider, LoginAgent)

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

[Unreleased]: https://github.com/devlikebear/quill/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/devlikebear/quill/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/devlikebear/quill/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/devlikebear/quill/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/devlikebear/quill/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/devlikebear/quill/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/devlikebear/quill/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/devlikebear/quill/releases/tag/v0.1.0
