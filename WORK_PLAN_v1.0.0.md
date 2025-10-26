# Work Plan: v1.0.0 - Claude Agent SDK 기반 재구현

**Issue**: #12
**Branch**: `feature/12-agent-sdk-migration`
**Estimated Time**: 8-12 hours
**Priority**: Critical (Major Release)
**Breaking Changes**: Yes

## 목표

Quill을 Claude Agent SDK 기반으로 전면 재구현하여 PLAN.md의 원래 아키텍처를 완전히 구현합니다.

## 배경 및 현황 분석

### 현재 구현 (v0.5.0)

```
quill/
├── src/
│   ├── agent/
│   │   ├── main-agent.ts          ❌ Playwright 라이브러리 직접 사용
│   │   └── subagents/
│   │       ├── web-crawler.ts     ❌ 수동 BFS 크롤링
│   │       ├── document-generator.ts ❌ 정적 문서 생성
│   │       └── login-agent.ts     ❌ 수동 폼 감지
│   ├── mcp/
│   │   └── playwright.ts          ❌ Playwright 래퍼 (MCP 아님)
│   └── ...
```

**문제점**:
- Claude의 AI 능력을 전혀 활용하지 못함
- UI 요소 설명이 비어있거나 의미없음 (type만 추출)
- 크롤링 전략이 단순 BFS (지능형 우선순위 없음)
- PLAN.md와 실제 구현이 완전히 다름

### 목표 구조 (v1.0.0)

```
quill/
├── src/
│   ├── utils/
│   │   ├── credentials.ts         ✅ NEW - 듀얼 인증
│   │   └── mcp-loader.ts          ✅ NEW - MCP 서버 로드
│   ├── agent/
│   │   ├── main-agent.ts          ✅ REWRITE - SDK query() 사용
│   │   └── subagents/
│   │       ├── web-crawler.ts     ✅ REWRITE - AI 기반 크롤링
│   │       ├── content-analyzer.ts ✅ NEW - AI 컨텐츠 분석
│   │       └── document-generator.ts ✅ UPDATE - AI 설명 통합
│   ├── skills/                    ✅ NEW - Claude Skills
│   │   └── web-manual-generator.skill/
│   └── cli/
│       └── commands/
│           └── generate.ts        ✅ UPDATE - Agent SDK 통합
├── .env.example                   ✅ NEW
└── mcp-servers.example.json       ✅ NEW
```

## 참고 구현: myagent 분석

`myagent` 리포지토리 분석 결과:

### 핵심 패턴

```typescript
// 1. query 함수 사용
import { query } from '@anthropic-ai/claude-agent-sdk';

const messageStream = query({
  prompt: fullPrompt,
  options: {
    model: 'claude-opus-4-1-20250805',
    permissionMode: 'default',
    allowedTools: ['WebSearch', 'WebFetch'],
    mcpServers: {
      'playwright': {
        type: 'stdio',
        command: 'npx',
        args: ['@playwright/mcp@latest']
      }
    }
  }
});

// 2. 스트리밍 응답 처리
for await (const message of messageStream) {
  if (message.type === 'result' && 'result' in message) {
    response = message.result;
  }
}

// 3. MCP 서버 로드
const anthropicHome = process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
const mcpConfig = JSON.parse(fs.readFileSync(path.join(anthropicHome, 'mcp-servers.json'), 'utf-8'));

// 4. 자격증명 관리
// API 키: ANTHROPIC_API_KEY 환경 변수
// Claude Code: credentials.json 파일 (~/.claude/credentials.json)
```

## 상세 구현 계획

### Phase 1: 기반 설정 (2시간)

#### 1.1 패키지 의존성 업데이트

**package.json**:
```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.27",  // NEW
    "@anthropic-ai/sdk": "^0.27.0",               // REMOVE (미사용)
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "docx": "^9.5.1",
    "dotenv": "^16.3.1",
    "ora": "^7.0.1"
    // playwright 제거 - MCP 서버로 사용
  }
}
```

#### 1.2 환경 설정 파일

**.env.example**:
```env
# Anthropic Authentication (Choose ONE)

# Option 1: API Key (Recommended for production)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Option 2: Claude Code Subscription
# ANTHROPIC_HOME=/Users/[username]/.claude

# MCP Servers
ENABLED_MCP_SERVERS=playwright

# Claude Configuration
CLAUDE_PERMISSION_MODE=default
CLAUDE_ALLOWED_TOOLS=WebSearch,WebFetch,Read,Write,Bash
CLAUDE_MODEL=claude-opus-4-1-20250805
```

**mcp-servers.example.json** (~/.claude/):
```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Phase 2: Credentials & MCP 유틸리티 (1.5시간)

#### 2.1 Credentials 유틸리티

**src/utils/credentials.ts**:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AnthropicCredentials {
  type: 'api-key' | 'claude-code';
  value: string;
}

/**
 * Load Anthropic credentials with priority:
 * 1. ANTHROPIC_API_KEY (highest priority)
 * 2. Claude Code credentials.json
 * 3. Error (no credentials found)
 */
export function loadAnthropicCredentials(): AnthropicCredentials {
  // 1. Check API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return {
      type: 'api-key',
      value: apiKey,
    };
  }

  // 2. Check Claude Code credentials
  const anthropicHome = process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
  const credentialsPath = path.join(anthropicHome, 'credentials.json');

  if (fs.existsSync(credentialsPath)) {
    try {
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
      if (credentials.sessionKey) {
        return {
          type: 'claude-code',
          value: credentials.sessionKey,
        };
      }
    } catch (error) {
      console.warn('Failed to load Claude Code credentials:', error);
    }
  }

  // 3. No credentials found
  throw new Error(
    'No Anthropic credentials found. Please set ANTHROPIC_API_KEY or ensure Claude Code is installed.'
  );
}

/**
 * Validate credentials
 */
export function validateCredentials(credentials: AnthropicCredentials): boolean {
  if (!credentials.value || credentials.value.trim() === '') {
    return false;
  }

  if (credentials.type === 'api-key') {
    // API 키는 sk-ant-로 시작해야 함
    return credentials.value.startsWith('sk-ant-');
  }

  return true;
}
```

#### 2.2 MCP 서버 로더

**src/utils/mcp-loader.ts**:
```typescript
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
    const anthropicHome = process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
    const mcpConfigPath = path.join(anthropicHome, 'mcp-servers.json');

    if (!fs.existsSync(mcpConfigPath)) {
      console.warn(`MCP config not found: ${mcpConfigPath}`);
      console.warn('Running without MCP servers.');
      return {};
    }

    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
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
      if (mcpConfig.servers[name]) {
        mcpServers[name] = {
          type: 'stdio',
          ...mcpConfig.servers[name],
        };
      }
    }

    console.log('MCP servers loaded:', Object.keys(mcpServers));
    return mcpServers;
  } catch (error) {
    console.error('Failed to load MCP servers:', error);
    return {};
  }
}
```

### Phase 3: Main Agent SDK 재구현 (3시간)

#### 3.1 Main Agent 완전 재작성

**src/agent/main-agent.ts**:
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { QuillConfig, AgentResult, PageInfo } from '../types/index.js';
import { loadAnthropicCredentials, validateCredentials } from '../utils/credentials.js';
import { loadMcpServers } from '../utils/mcp-loader.js';
import { logger } from '../utils/logger.js';

/**
 * Main Agent using Claude Agent SDK
 */
export class MainAgent {
  private config: QuillConfig;

  constructor(config: QuillConfig) {
    this.config = config;
  }

  /**
   * Execute documentation generation workflow using Agent SDK
   */
  async execute(): Promise<AgentResult<PageInfo[]>> {
    try {
      logger.info('Starting Agent SDK workflow...');

      // 1. Load credentials
      const credentials = loadAnthropicCredentials();
      if (!validateCredentials(credentials)) {
        throw new Error('Invalid Anthropic credentials');
      }
      logger.info(`Using ${credentials.type} authentication`);

      // 2. Load MCP servers
      const mcpServers = loadMcpServers();

      // 3. Build system prompt
      const systemPrompt = this.buildSystemPrompt();

      // 4. Build task prompt
      const taskPrompt = this.buildTaskPrompt();

      // 5. Execute query
      logger.info('Executing Agent query...');
      const messageStream = query({
        prompt: taskPrompt,
        options: {
          model: process.env.CLAUDE_MODEL || 'claude-opus-4-1-20250805',
          systemPrompt,
          permissionMode: (process.env.CLAUDE_PERMISSION_MODE as any) || 'default',
          allowedTools: this.getAllowedTools(),
          mcpServers: Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
        },
      });

      // 6. Process streaming response
      let result: string = '';
      const pages: PageInfo[] = [];

      for await (const message of messageStream) {
        // Handle result
        if (message.type === 'result' && 'result' in message) {
          result = message.result as string;
        }

        // Handle tool usage
        if ('type' in message && message.type === 'tool_use') {
          logger.info(`Tool used: ${(message as any).name}`);
        }

        // Handle assistant messages
        if (message.type === 'assistant' && 'message' in message) {
          const assistantMessage = message.message;
          if ('content' in assistantMessage && Array.isArray(assistantMessage.content)) {
            for (const block of assistantMessage.content) {
              if ('text' in block && typeof block.text === 'string') {
                // Parse JSON results from agent
                try {
                  const parsed = JSON.parse(block.text);
                  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
                    pages.push(...parsed);
                  }
                } catch {
                  // Not JSON, continue
                }
              }
            }
          }
        }
      }

      logger.info(`Agent execution completed. Pages found: ${pages.length}`);

      return {
        success: true,
        data: pages,
      };
    } catch (error) {
      logger.error('Agent execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build system prompt for the agent
   */
  private buildSystemPrompt(): string {
    return `You are an expert technical documentation generator.

Your task is to:
1. Navigate web applications using Playwright MCP
2. Crawl pages systematically (BFS, depth-limited)
3. Analyze UI elements and their purpose
4. Generate meaningful descriptions for each element
5. Capture screenshots of important pages
6. Return structured page information as JSON

Output Format:
Return a JSON array of pages with this structure:
[
  {
    "url": "https://example.com/page",
    "title": "Page Title",
    "description": "AI-generated page description",
    "screenshot": "path/to/screenshot.png",
    "links": ["https://example.com/link1"],
    "elements": [
      {
        "type": "button",
        "text": "Submit",
        "description": "AI-generated element description explaining its purpose"
      }
    ]
  }
]

Key Requirements:
- Generate MEANINGFUL descriptions (not just "button", but "Submit button to save user profile changes")
- Prioritize important pages (dashboards, main features)
- Respect crawling depth limit
- Handle authentication if configured
- Be thorough but efficient`;
  }

  /**
   * Build task-specific prompt
   */
  private buildTaskPrompt(): string {
    const depth = this.config.depth ?? 2;
    const authNote = this.config.auth
      ? `\nAuthentication: Login at ${this.config.auth.loginUrl || this.config.url} before crawling.`
      : '';

    return `Generate comprehensive documentation for the following web application:

URL: ${this.config.url}
Crawling Depth: ${depth} levels${authNote}
Output Format: ${this.config.format || 'markdown'}

Steps:
1. Navigate to ${this.config.url} using Playwright MCP
2. ${this.config.auth ? 'Authenticate with provided credentials' : 'Start crawling immediately'}
3. Crawl pages up to ${depth} levels deep
4. For each page:
   - Capture screenshot
   - Extract all UI elements (buttons, inputs, links, etc.)
   - Generate AI-powered descriptions for each element
   - Identify navigation links for next level
5. Return complete JSON array of all pages

Begin crawling now.`;
  }

  /**
   * Get allowed tools based on configuration
   */
  private getAllowedTools(): string[] {
    const envTools = process.env.CLAUDE_ALLOWED_TOOLS;
    if (envTools) {
      return envTools.split(',').map((t) => t.trim());
    }

    // Default tools
    return [
      'WebSearch',
      'WebFetch',
      'Read',
      'Write',
      'Bash',
      'mcp__playwright__browser_navigate',
      'mcp__playwright__browser_click',
      'mcp__playwright__browser_take_screenshot',
      'mcp__playwright__browser_snapshot',
    ];
  }
}
```

### Phase 4: CLI 업데이트 (1.5시간)

#### 4.1 Generate Command 수정

**src/cli/commands/generate.ts**:
```typescript
// ... existing imports
import { MainAgent } from '../../agent/main-agent.js';
import { DocumentGenerator } from '../../agent/subagents/document-generator.js';
import { MarkdownFormatter } from '../../output/formatters/markdown.js';

export async function generateCommand(options: GenerateOptions): Promise<void> {
  console.log(chalk.bold.cyan('\n🪶 Quill - AI Documentation Generator\n'));

  // ... existing config setup

  const spinner = ora('Initializing Agent SDK...').start();

  try {
    // Create main agent (now using SDK)
    const agent = new MainAgent(config);
    spinner.succeed(chalk.green('Agent SDK initialized!'));

    // Execute agent workflow
    spinner.start('Agent is crawling and analyzing...');
    const result = await agent.execute();

    if (!result.success) {
      spinner.fail(chalk.red('Agent execution failed!'));
      console.error(chalk.red(`Error: ${result.error}`));
      process.exit(1);
    }

    const pages = result.data!;
    spinner.succeed(chalk.green(`Agent completed! ${pages.length} pages analyzed.`));

    // ... rest of formatting and saving logic (unchanged)
  } catch (error) {
    // ... error handling
  }
}
```

### Phase 5: Skills 추가 (Optional, 2시간)

#### 5.1 Web Manual Generator Skill

**skills/web-manual-generator.skill/skill.md**:
```markdown
---
name: web-manual-generator
description: Generate comprehensive user manuals for web applications
tags: [documentation, web, automation]
---

# Web Manual Generator Skill

This skill enables Claude to automatically generate professional user manuals for web applications.

## Capabilities

- Intelligent page crawling with priority-based navigation
- AI-powered UI element analysis and description
- Screenshot capture with annotations
- Multi-format output (Markdown, DOCX, HTML)
- Authentication handling for internal systems

## Usage

```bash
quill generate --url https://example.com --depth 3 --format docx
```

## Workflow

1. **Navigate**: Access target URL using Playwright MCP
2. **Authenticate**: Handle login if required
3. **Crawl**: Systematically explore pages (BFS)
4. **Analyze**: Generate AI descriptions for UI elements
5. **Capture**: Take screenshots of key pages
6. **Generate**: Create structured documentation
7. **Format**: Output in requested format

## Configuration

- `depth`: Crawling depth (default: 2)
- `format`: Output format (markdown|docx|html)
- `auth`: Authentication configuration
```

### Phase 6: 타입 업데이트 (30분)

**src/types/index.ts** 수정:
```typescript
// Add AgentSDK configuration
export interface QuillConfig {
  url: string;
  depth?: number;
  format?: OutputFormat;
  output?: string;
  language?: string;
  auth?: AuthConfig;

  // NEW: Agent SDK options
  agentModel?: string;  // default: claude-opus-4-1-20250805
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
  allowedTools?: string[];
  mcpServers?: Record<string, any>;
}
```

## 테스트 계획

### 1. Credentials 테스트
```bash
# Test API Key
export ANTHROPIC_API_KEY=sk-ant-xxxxx
npm run build && ./dist/cli/index.js generate --url https://example.com

# Test Claude Code credentials
unset ANTHROPIC_API_KEY
export ANTHROPIC_HOME=/Users/[username]/.claude
npm run build && ./dist/cli/index.js generate --url https://example.com
```

### 2. MCP 서버 테스트
```bash
# Ensure ~/.claude/mcp-servers.json exists
export ENABLED_MCP_SERVERS=playwright
npm run build && ./dist/cli/index.js generate --url https://example.com
```

### 3. 전체 워크플로우 테스트
```bash
quill generate \
  --url https://example.com \
  --depth 2 \
  --format docx \
  --output ./docs
```

## 마이그레이션 가이드

### v0.5.0 → v1.0.0

**Breaking Changes**:
1. ⚠️ `@anthropic-ai/sdk` → `@anthropic-ai/claude-agent-sdk`
2. ⚠️ Playwright 라이브러리 제거 → Playwright MCP 사용
3. ⚠️ 환경 변수 추가 필요: `ANTHROPIC_API_KEY` 또는 `ANTHROPIC_HOME`
4. ⚠️ MCP 서버 설정 필요: `~/.claude/mcp-servers.json`

**Migration Steps**:
1. `.env` 파일 생성 (`.env.example` 참조)
2. `~/.claude/mcp-servers.json` 설정
3. 기존 코드 제거: `src/mcp/playwright.ts`
4. 새 패키지 설치: `npm install`
5. 빌드 및 테스트: `npm run build && npm test`

## 파일 변경 체크리스트

### 새로운 파일
- [ ] `src/utils/credentials.ts`
- [ ] `src/utils/mcp-loader.ts`
- [ ] `skills/web-manual-generator.skill/skill.md`
- [ ] `.env.example`
- [ ] `mcp-servers.example.json`
- [ ] `MIGRATION_v1.0.0.md`

### 수정될 파일
- [ ] `package.json` (의존성 변경)
- [ ] `src/agent/main-agent.ts` (완전 재작성)
- [ ] `src/cli/commands/generate.ts` (Agent SDK 통합)
- [ ] `src/types/index.ts` (Agent SDK 타입 추가)
- [ ] `README.md` (사용법 업데이트)
- [ ] `CHANGELOG.md` (v1.0.0 릴리즈 노트)

### 제거될 파일
- [ ] `src/mcp/playwright.ts` (MCP 서버로 대체)
- [ ] `@anthropic-ai/sdk` 패키지 제거

## 수락 기준 (Definition of Done)

- [ ] Claude Agent SDK `query()` 함수 사용
- [ ] 듀얼 인증 지원 (API 키 + Claude Code)
- [ ] MCP 서버 로드 및 통합
- [ ] AI 기반 UI 요소 설명 생성
- [ ] 모든 기존 기능 작동 (크롤링, 포맷팅)
- [ ] 타입 체크 및 빌드 통과
- [ ] `.env.example` 및 `mcp-servers.example.json` 제공
- [ ] README 업데이트 (마이그레이션 가이드 포함)
- [ ] CHANGELOG.md 업데이트
- [ ] 실제 웹사이트 테스트 성공

## 타임라인

| 단계 | 예상 시간 | 완료 시간 |
|------|-----------|-----------|
| Phase 1: 기반 설정 | 2시간 | |
| Phase 2: Credentials & MCP | 1.5시간 | |
| Phase 3: Main Agent 재구현 | 3시간 | |
| Phase 4: CLI 업데이트 | 1.5시간 | |
| Phase 5: Skills 추가 | 2시간 | |
| Phase 6: 타입 업데이트 | 30분 | |
| 테스트 및 검증 | 1.5시간 | |
| **총계** | **12시간** | |

## 리스크 및 대응

### 리스크 1: MCP 서버 연결 실패
**대응**: Fallback 모드 구현 (MCP 없이도 기본 크롤링 가능)

### 리스크 2: AI 응답 파싱 실패
**대응**: Robust JSON 파싱 + 에러 복구 로직

### 리스크 3: 높은 API 비용
**대응**: 토큰 사용량 모니터링 + 경고 메시지

### 리스크 4: 기존 사용자 호환성
**대응**: 상세한 마이그레이션 가이드 + v0.5.0 브랜치 유지

## 다음 단계 (v1.1.0)

- PDF 출력 형식 추가
- 증분 업데이트 기능
- Confluence/Notion 직접 퍼블리시
- 다국어 지원 확장
