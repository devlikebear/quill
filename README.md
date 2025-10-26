# Quill 🪶

> AI-powered documentation generator for web applications

Quill은 Claude Agent SDK와 Playwright MCP를 활용하여 웹 애플리케이션의 사용자 매뉴얼을 자동으로 생성하는 CLI 도구입니다.

## ✨ 주요 기능

- 🤖 **지능형 크롤링**: AI 에이전트가 웹 애플리케이션을 자동으로 탐색
- 📸 **자동 스크린샷**: 각 페이지와 주요 UI 요소를 자동 캡처
- 📄 **다양한 출력 형식**: Markdown, HTML, DOCX 지원
- 🔐 **인증 지원**: 내부 시스템 접근을 위한 세션 관리
- 🎯 **컨텍스트 인식**: UI 요소를 분석하여 의미있는 설명 자동 생성
- 🔄 **항상 최신**: 시스템 변경 시 간단한 명령으로 문서 재생성

## 🚀 빠른 시작

### 설치

```bash
# 소스에서 빌드
git clone https://github.com/devlikebear/quill.git
cd quill
npm install
npm run build
npm link
```

### 환경 설정

**Option 1: API Key 사용 (권장)**

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

**Option 2: Claude Code 구독 계정 사용**

```bash
# Claude Code 설정 디렉토리 지정 (선택사항)
export ANTHROPIC_HOME=/Users/[username]/.claude
```

Claude Code가 설치되어 있다면 `~/.claude/credentials.json`의 sessionKey를 자동으로 사용합니다.

### MCP 서버 설정

Playwright MCP 서버를 설정해야 합니다:

```bash
# ~/.claude/mcp-servers.json 생성 (또는 프로젝트의 mcp-servers.example.json 복사)
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## 기본 사용법

### 1. 간단한 매뉴얼 생성

```bash
quill generate --url https://example.com
```

### 2. 출력 형식 지정

```bash
quill generate \
  --url https://example.com \
  --depth 2 \
  --format docx \
  --output ./docs
```

### 3. 인증이 필요한 시스템

```bash
quill generate \
  --url http://internal-system.com \
  --auth-type session \
  --login-url http://internal-system.com/login \
  --username admin \
  --password secret
```

## CLI 옵션

```bash
quill generate [options]

Options:
  --url <url>              Target URL to document (required)
  --depth <number>         Crawling depth (default: 2)
  --format <type>          Output format: markdown|html|docx (default: markdown)
  --output <path>          Output directory (default: ./output)
  --language <lang>        Documentation language (default: en)

Authentication:
  --auth-type <type>       Authentication type: session|basic|oauth
  --login-url <url>        Login URL for session-based auth
  --username <username>    Username for authentication
  --password <password>    Password for authentication
  --auth-interactive       Interactive authentication mode
```

## 환경 변수

```bash
# Anthropic 인증 (둘 중 하나 선택)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
ANTHROPIC_HOME=/Users/[username]/.claude

# MCP 서버 설정
ENABLED_MCP_SERVERS=playwright

# Claude 모델 설정
CLAUDE_MODEL=claude-opus-4-1-20250805
CLAUDE_PERMISSION_MODE=default
CLAUDE_ALLOWED_TOOLS=WebSearch,WebFetch,Read,Write,Bash
```

## 아키텍처

```
Quill CLI
    │
    ├─ Main Agent (Claude Agent SDK)
    │   ├─ Crawling & Analysis
    │   ├─ Screenshot Capture
    │   └─ Element Description
    │
    ├─ Document Generator
    │   ├─ Structure Generation
    │   └─ TOC Creation
    │
    ├─ Output Formatters
    │   ├─ Markdown
    │   ├─ HTML
    │   └─ DOCX
    │
    └─ MCP Servers
        └─ Playwright (Browser Automation)
```

## v1.0.0 주요 변경사항

**⚠️ Breaking Changes:**

- Claude Agent SDK 기반으로 완전히 재작성
- 직접 Playwright 사용에서 Playwright MCP로 전환
- 이중 인증 방식 지원 (API Key + Claude Code)
- 환경 변수 및 설정 방식 변경

자세한 내용은 [CHANGELOG.md](./CHANGELOG.md)를 참고하세요.

## 개발

```bash
# 의존성 설치
npm install

# 개발 모드 (watch)
npm run dev

# 타입 체크
npm run type-check

# 린트
npm run lint

# 빌드
npm run build
```

## 기술 스택

- **TypeScript 5.3+**: 메인 언어
- **Node.js 18+**: 런타임 환경
- **Claude Agent SDK v0.1.27**: 지능형 에이전트 오케스트레이션
- **Playwright MCP**: 브라우저 자동화 MCP 서버
- **Commander.js**: CLI 프레임워크
- **Claude Opus 4**: 컨텍스트 이해 및 문서 생성

## 라이선스

MIT License

## 제작

Built with ❤️ using Claude Agent SDK & Playwright MCP
