회사 내부 시스템의 매뉴얼을 자동으로 작성하는 에이전트를 개발하는 흥미로운 프로젝트네요. 이 주제에 대해 종합적으로 리서치해보겠습니다.네, 리서치 결과를 종합적으로 정리해드리겠습니다. 창헌님의 팀에서 회사 내부 시스템의 매뉴얼을 자동으로 작성하는 Claude Agent SDK 기반 CLI 앱을 개발하는 것은 **충분히 가능**하며, 매우 실용적인 프로젝트입니다.

## 🎯 핵심 결론: 실현 가능성

Claude Agent SDK는 Claude Code를 구동하는 인프라로, 코딩뿐만 아니라 다양한 일반 작업에 활용할 수 있으며, 파일 시스템 접근, bash 명령 실행, 웹 검색 등의 기본 도구를 제공합니다. MCP(Model Context Protocol)를 통한 확장성도 지원하므로, Playwright와 같은 브라우저 자동화 도구를 통합할 수 있습니다.

## 🛠️ 필요한 주요 구성요소

### 1. **Playwright MCP 서버** (핵심 컴포넌트)

Microsoft의 Playwright MCP는 브라우저 자동화 기능을 제공하며, 스크린샷 기반이 아닌 접근성 트리(accessibility tree)를 사용하여 웹 페이지와 구조화된 방식으로 상호작용합니다.

**주요 기능:**
- 웹 페이지 탐색 및 폼 작성, 구조화된 콘텐츠에서 데이터 추출, LLM 기반 자동화 테스팅
- 전체 페이지 스크린샷 또는 특정 CSS 선택자 영역 캡처, 다양한 브라우저 지원(Chrome, Firefox, WebKit)
- 세션 관리(지속 프로필, 격리 모드), 브라우저 확장 기능을 통한 연결 지원

### 2. **Claude Skills** (작업 전문화)

Claude Skills는 폴더 구조의 마크다운 파일로, 특정 작업을 수행하는 방법을 Claude에게 가르치는 패턴입니다. YAML 메타데이터와 선택적 스크립트로 구성되며, 필요 시 자동으로 로드됩니다.

**장점:**
- Progressive disclosure 설계로 필요한 정보만 컨텍스트에 로드하여 토큰 효율적
- Claude가 작업에 따라 관련 스킬을 자동으로 호출하며, 수동 선택이 필요 없음
- MCP보다 간단하고 직관적 (마크다운 + YAML)

**매뉴얼 생성을 위한 커스텀 스킬 예시:**
```yaml
---
name: web-manual-generator
description: 내부 웹 시스템의 사용자 매뉴얼을 자동 생성
---

# Web Manual Generator Skill

이 스킬은 웹 애플리케이션을 크롤링하고 각 페이지의 기능을 분석하여
사용자 매뉴얼을 자동으로 생성합니다.

## 워크플로우

1. Playwright MCP를 사용하여 시작 URL 접근
2. 내부 링크를 발견하고 각 페이지 방문
3. 각 페이지의 UI 요소와 기능을 분석
4. 스크린샷 촬영 및 주석 추가
5. 단계별 가이드 생성
6. 최종 매뉴얼 문서 조합
```

### 3. **Claude Agent SDK 플러그인**

Claude Code는 플러그인을 지원하며, 이를 통해 slash commands, subagents, MCP 서버, hooks를 패키징할 수 있습니다.

## 📐 제안 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│           Claude Agent SDK CLI App                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Main Agent (Orchestrator)                     │    │
│  │  - 전체 워크플로우 관리                          │    │
│  │  - 진행 상황 추적                                │    │
│  │  - 최종 문서 생성                                │    │
│  └────────────────┬───────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────┴───────────────────────────────┐    │
│  │  Subagents (전문화된 작업)                      │    │
│  │                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐           │    │
│  │  │  Web Crawler │  │  Screenshot   │           │    │
│  │  │  Agent       │  │  Agent        │           │    │
│  │  └──────────────┘  └──────────────┘           │    │
│  │                                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐           │    │
│  │  │  Content     │  │  Document     │           │    │
│  │  │  Analyzer    │  │  Generator    │           │    │
│  │  └──────────────┘  └──────────────┘           │    │
│  └──────────────────────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────┴───────────────────────────────┐    │
│  │  MCP Servers & Tools                            │    │
│  │                                                  │    │
│  │  - Playwright MCP (웹 자동화)                    │    │
│  │  - Custom MCP (내부 시스템 인증)                 │    │
│  │  - File System (로컬 파일 작업)                  │    │
│  └──────────────────────────────────────────────┘    │
│                   │                                      │
│  ┌────────────────┴───────────────────────────────┐    │
│  │  Skills                                         │    │
│  │                                                  │    │
│  │  - web-manual-generator.skill                   │    │
│  │  - screenshot-annotator.skill                   │    │
│  │  - docx-creator.skill                           │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Output              │
        │  - Word 문서         │
        │  - Markdown          │
        │  - HTML              │
        └──────────────────────┘
```

## 💡 실제 구현 워크플로우

```typescript
// TypeScript SDK 예시
import { Agent } from '@anthropic-ai/sdk';

// 메인 에이전트 설정
const agent = new Agent({
  systemPrompt: `
    당신은 웹 애플리케이션의 사용자 매뉴얼을 자동으로 생성하는 전문가입니다.
    Playwright MCP를 사용하여 웹사이트를 탐색하고,
    각 페이지의 기능을 분석하여 단계별 가이드를 작성합니다.
  `,
  tools: [
    'bash',
    'file_read',
    'file_write',
    'file_create'
  ],
  mcpServers: [
    {
      name: 'playwright',
      command: 'npx',
      args: ['@playwright/mcp@latest']
    }
  ],
  settingSources: ['project'],  // Skills 로드
  plugins: [
    'manual-generator-plugin'
  ]
});

// 매뉴얼 생성 실행
const result = await agent.query(`
다음 내부 시스템의 사용자 매뉴얼을 생성해주세요:
- URL: http://internal-monitoring.company.com
- 인증: 환경 변수에서 가져오기
- 깊이: 2레벨 크롤링
- 출력: Word 문서 + Markdown
`);
```

## 🌟 유사 성공 사례

### 1. **Scribe** (상용 제품)

Scribe는 화면을 녹화하면서 모든 클릭을 자동으로 인식하여 스크린샷과 주석이 달린 단계별 가이드를 자동 생성합니다. Fortune 500의 94%가 사용하며, 프로세스 문서화를 12배 빠르게 수행합니다.

### 2. **shot-scraper** (오픈소스)

Simon Willison이 만든 shot-scraper는 Playwright 기반으로 문서화용 스크린샷을 자동화하며, CSS 선택자로 특정 영역을 캡처하고 JavaScript 주입으로 페이지를 수정할 수 있습니다.

### 3. **Kong의 문서팀**

Kong의 문서팀은 shot-scraper를 사용하여 UI 개발 속도와 관계없이 정확한 스크린샷을 제공하며, 한 번 스크립트를 작성하면 항상 최신 상태의 재현 가능한 스크린샷을 얻습니다.

## ⚠️ 구현 시 주요 고려사항

### 1. **인증 처리**
Playwright MCP는 지속 프로필 모드를 지원하여 로그인 정보를 저장하거나, --storage-state 인자로 초기 인증 상태를 제공할 수 있습니다.

```bash
# 초기 인증 상태 저장
npx @playwright/mcp --user-data-dir=/path/to/profile --save-session
```

### 2. **보안**
- Skills는 코드 실행 권한을 부여하므로, 신뢰할 수 있는 소스의 스킬만 사용해야 합니다
- 민감한 정보는 환경 변수나 secrets 파일로 관리
- --secrets 옵션으로 dotenv 형식의 시크릿 파일 경로 지정 가능

### 3. **성능 최적화**
- 컨텍스트 관리: SDK가 자동 컨텍스트 압축과 관리를 제공하여 에이전트가 컨텍스트를 초과하지 않도록 보장합니다
- 체크포인트 기능을 사용하여 진행 상황을 저장하고 이전 상태로 롤백 가능
- 병렬 처리: 여러 페이지를 동시에 크롤링

### 4. **출력 형식**
- Word 문서(.docx), Markdown, HTML, PDF 등 다양한 형식으로 출력 가능
- Claude의 기본 Skills 활용: docx, xlsx, pptx 생성 스킬 사용

## 🎯 실용적인 구현 단계

### Phase 1: MVP (2-3주)
1. Playwright MCP 설정 및 테스트
2. 단일 페이지 크롤링 + 스크린샷
3. 기본 마크다운 매뉴얼 생성
4. CLI 인터페이스 구축

### Phase 2: 고도화 (2-3주)
1. 멀티 페이지 크롤링 (내부 링크 탐색)
2. UI 요소 자동 분석 및 설명 생성
3. Custom Skills 개발
4. Word/HTML 출력 추가

### Phase 3: 운영화 (1-2주)
1. 인증 처리 자동화
2. 에러 처리 및 재시도 로직
3. 진행 상황 모니터링
4. CI/CD 통합

## 📊 예상 효과

**창헌님 팀의 경우:**
- 40,000+ 호스트 모니터링 시스템의 매뉴얼 자동 생성
- Grafana 대시보드 사용법 자동 문서화
- SE/DBA/파트너사를 위한 맞춤형 가이드 생성
- 시스템 변경 시 매뉴얼 자동 업데이트

## 🔗 추가 리소스

- **Claude Agent SDK 문서**: https://docs.claude.com/en/api/agent-sdk/overview
- **Playwright MCP GitHub**: https://github.com/microsoft/playwright-mcp
- **Claude Skills 가이드**: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- **Building Effective Agents**: https://www.anthropic.com/engineering/building-effective-agents

이 프로젝트는 팀의 문서화 부담을 크게 줄이고, 항상 최신 상태의 정확한 매뉴얼을 유지할 수 있게 해줄 것입니다. GitLab 통합과 함께 사용하면 코드 변경 시 자동으로 매뉴얼도 업데이트되는 파이프라인 구축도 가능합니다!