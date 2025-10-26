# Claude Code 구독 계정을 활용한 Claude Agent SDK 사용 가이드

> 별도의 ANTHROPIC_API_KEY 없이 로컬 Claude Code 구독 계정으로 Claude Agent SDK를 사용하는 방법

## 📖 개요

Claude Agent SDK는 두 가지 인증 방식을 지원합니다:

1. **Anthropic API 키 사용** (별도 과금)
2. **Claude Code 구독 계정 사용** (이 가이드의 주제) ⭐

이미 Claude Code를 구독하고 있다면, **별도의 API 키 없이** 로컬 Claude Code의 자격증명을 재사용하여 웹 애플리케이션이나 다른 프로젝트에서 Claude Agent SDK를 사용할 수 있습니다.

## 🎯 장점

- ✅ **추가 비용 없음** - Claude Code 구독만으로 사용 가능
- ✅ **간편한 설정** - API 키 발급 불필요
- ✅ **MCP 서버 공유** - 로컬 Claude Code의 MCP 서버 설정 재사용
- ✅ **플러그인/스킬 공유** - 설치된 플러그인과 스킬 활용 가능
- ✅ **일관된 환경** - Claude Code와 동일한 설정 사용

## 📋 사전 요구사항

1. **Claude Code가 로컬에 설치되어 있어야 함**
   - macOS: `~/.claude` 디렉토리 존재
   - Windows: `%USERPROFILE%\.claude` 디렉토리 존재
   - Linux: `~/.claude` 디렉토리 존재

2. **Claude Code 구독 계정**
   - Pro 또는 Team 플랜 구독 중
   - 로그인되어 있어야 함

3. **Node.js 프로젝트**
   - Node.js 18 이상
   - `@anthropic-ai/claude-agent-sdk` 패키지 설치

## 🚀 빠른 시작 (3단계)

### 1단계: Claude Code 자격증명 경로 확인

터미널에서 Claude Code 설정 디렉토리가 존재하는지 확인:

```bash
# macOS/Linux
ls -la ~/.claude

# Windows (PowerShell)
ls $env:USERPROFILE\.claude
```

**확인해야 할 파일들:**
- `credentials.json` - 인증 정보 (반드시 필요)
- `mcp-servers.json` - MCP 서버 설정 (선택사항)
- `settings.json` - 플러그인 설정 (선택사항)
- `plugins/` 디렉토리 - 설치된 플러그인 (선택사항)
- `skills/` 디렉토리 - 설치된 스킬 (선택사항)

### 2단계: 프로젝트에 환경 변수 설정

프로젝트 루트에 `.env.local` (또는 `.env`) 파일을 생성하고 다음 내용 추가:

```bash
# ===== Claude Code 구독 계정 사용 =====

# Claude Code 자격증명 경로 설정
ANTHROPIC_HOME=/Users/[사용자명]/.claude

# 별도의 API 키는 필요 없습니다!
# Claude Code 구독으로 자동 인증됩니다.
```

**경로 예시:**
- macOS: `ANTHROPIC_HOME=/Users/john/.claude`
- Windows: `ANTHROPIC_HOME=C:\Users\John\.claude`
- Linux: `ANTHROPIC_HOME=/home/john/.claude`

### 3단계: Claude Agent SDK 사용

Node.js/TypeScript 코드에서 사용:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const response = await query({
  prompt: "안녕하세요!",
  options: {
    model: "claude-opus-4-1-20250805"
  }
});

console.log(response);
```

**중요:** 코드에 `apiKey` 옵션을 **전달하지 않으면** SDK가 자동으로 `ANTHROPIC_HOME` 경로의 자격증명을 사용합니다.

## 🔧 상세 설정

### Next.js API Route 예제

```typescript
// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { query } from '@anthropic-ai/claude-agent-sdk';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  try {
    // ANTHROPIC_HOME 환경변수가 설정되어 있으면
    // 자동으로 Claude Code 자격증명을 사용합니다
    const messageStream = query({
      prompt: message,
      options: {
        model: 'claude-opus-4-1-20250805',
        permissionMode: 'default', // 권한 모드 설정
      },
    });

    // 스트리밍 응답 처리
    const stream = new ReadableStream({
      async start(controller) {
        for await (const msg of messageStream) {
          // 메시지 처리 및 전송
          controller.enqueue(new TextEncoder().encode(JSON.stringify(msg) + '\n'));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Claude SDK Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
```

### Express.js 서버 예제

```javascript
// server.js
import express from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';

const app = express();
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await query({
      prompt: message,
      options: {
        model: 'claude-opus-4-1-20250805'
      }
    });

    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## 🔌 MCP 서버 활용

로컬 Claude Code에 설치된 MCP 서버를 웹 프로젝트에서도 사용할 수 있습니다.

### MCP 서버 설정 로드 예제

```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';

// MCP 서버 설정 타입
interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface McpServersJson {
  servers: Record<string, McpServerConfig>;
}

// MCP 서버 설정 로드 함수
function loadMcpServers() {
  const anthropicHome = process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
  const mcpConfigPath = path.join(anthropicHome, 'mcp-servers.json');

  if (!fs.existsSync(mcpConfigPath)) {
    console.log('MCP 서버 설정 파일 없음:', mcpConfigPath);
    return {};
  }

  const mcpConfig: McpServersJson = JSON.parse(
    fs.readFileSync(mcpConfigPath, 'utf-8')
  );

  // 활성화할 MCP 서버 필터링 (환경변수로 제어)
  const enabledServersStr = process.env.ENABLED_MCP_SERVERS || '';
  const enabledServers = enabledServersStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (enabledServers.length === 0) {
    console.log('활성화된 MCP 서버 없음');
    return {};
  }

  // SDK 형식으로 변환
  const mcpServers = Object.fromEntries(
    Object.entries(mcpConfig.servers)
      .filter(([name]) => enabledServers.includes(name))
      .map(([name, config]) => [
        name,
        {
          type: 'stdio' as const,
          command: config.command,
          args: config.args,
          ...(config.env && { env: config.env }),
        },
      ])
  );

  return mcpServers;
}

// 사용 예시
const mcpServers = loadMcpServers();

const response = await query({
  prompt: "웹을 검색해서 최신 뉴스를 알려줘",
  options: {
    model: 'claude-opus-4-1-20250805',
    mcpServers: Object.keys(mcpServers).length > 0 ? mcpServers : undefined,
  }
});
```

### MCP 서버 선택적 활성화

`.env.local`에서 사용할 MCP 서버를 제어:

```bash
# 활성화할 MCP 서버 목록 (쉼표로 구분)
ENABLED_MCP_SERVERS=sequential-thinking,context7,playwright,desktop-commander

# 또는 특정 서버만 제외하고 모두 사용
# DISABLED_MCP_SERVERS=memory,desktop-commander
```

## 🎨 권한 및 도구 제어

Claude Agent SDK의 도구 사용 권한을 세밀하게 제어할 수 있습니다.

### 권한 모드 설정

```bash
# .env.local

# 권한 모드: default | acceptEdits | bypassPermissions
# - default: 모든 도구 사용 시 권한 확인 (프로덕션 권장)
# - acceptEdits: 파일 수정 자동 승인 (개발용)
# - bypassPermissions: 모든 도구 자동 승인 (테스트용, 위험)
CLAUDE_PERMISSION_MODE=default

# 허용할 도구 (쉼표로 구분)
CLAUDE_ALLOWED_TOOLS=WebSearch,WebFetch,Read,Glob,Grep

# 차단할 도구 (쉼표로 구분)
# 보안 중요: Write, Edit, Bash는 프로덕션에서 차단 권장
CLAUDE_DISALLOWED_TOOLS=Write,Edit,Bash,Task
```

### 코드에서 권한 설정 사용

```typescript
const permissionMode = (process.env.CLAUDE_PERMISSION_MODE || 'default') as
  | 'default'
  | 'acceptEdits'
  | 'bypassPermissions';

const allowedTools = (process.env.CLAUDE_ALLOWED_TOOLS || 'WebSearch,WebFetch')
  .split(',')
  .map(tool => tool.trim());

const disallowedTools = (process.env.CLAUDE_DISALLOWED_TOOLS || '')
  .split(',')
  .map(tool => tool.trim())
  .filter(Boolean);

const response = await query({
  prompt: message,
  options: {
    model: 'claude-opus-4-1-20250805',
    permissionMode,
    allowedTools,
    disallowedTools: disallowedTools.length > 0 ? disallowedTools : undefined,
  }
});
```

## 🔐 보안 고려사항

### 1. 자격증명 파일 보호

```bash
# Claude Code 자격증명은 민감한 정보입니다
# 절대로 git에 커밋하지 마세요!

# .gitignore에 추가
.env.local
.env
credentials.json
```

### 2. 프로덕션 환경에서의 주의사항

⚠️ **프로덕션 배포 시 권장사항:**

1. **Claude Code 자격증명 사용은 개발/테스트 환경에만 권장**
   - 프로덕션에서는 별도의 Anthropic API 키 사용 권장
   - API 키는 사용량 추적 및 제한 설정이 가능

2. **서버 환경에서 사용 시:**
   - 파일 시스템 권한 확인 (`~/.claude/credentials.json` 읽기 권한)
   - 환경 변수 노출 방지
   - HTTPS 사용 필수

3. **도구 권한 최소화:**
   ```bash
   # 프로덕션 권장 설정
   CLAUDE_PERMISSION_MODE=default
   CLAUDE_ALLOWED_TOOLS=WebSearch,WebFetch,Read
   CLAUDE_DISALLOWED_TOOLS=Write,Edit,Bash,Task
   ```

### 3. 환경 분리

```bash
# .env.development (개발 환경)
ANTHROPIC_HOME=/Users/john/.claude
CLAUDE_PERMISSION_MODE=bypassPermissions
CLAUDE_ALLOWED_TOOLS=WebSearch,WebFetch,Read,Write,Edit

# .env.production (프로덕션 환경)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
CLAUDE_PERMISSION_MODE=default
CLAUDE_ALLOWED_TOOLS=WebSearch,WebFetch,Read
CLAUDE_DISALLOWED_TOOLS=Write,Edit,Bash,Task
```

## 🧪 동작 확인

### 1. 자격증명 확인 스크립트

```javascript
// test-credentials.js
import fs from 'fs';
import path from 'path';
import os from 'os';

const anthropicHome = process.env.ANTHROPIC_HOME || path.join(os.homedir(), '.claude');
const credentialsPath = path.join(anthropicHome, 'credentials.json');

console.log('ANTHROPIC_HOME:', anthropicHome);
console.log('Credentials 경로:', credentialsPath);
console.log('Credentials 파일 존재:', fs.existsSync(credentialsPath));

if (fs.existsSync(credentialsPath)) {
  try {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    console.log('✅ 자격증명 파일 로드 성공');
    console.log('계정 정보:', credentials.email ? '로그인됨' : '로그인 필요');
  } catch (error) {
    console.error('❌ 자격증명 파일 파싱 실패:', error.message);
  }
} else {
  console.error('❌ 자격증명 파일을 찾을 수 없습니다');
  console.log('💡 Claude Code를 설치하고 로그인하세요');
}
```

실행:
```bash
node test-credentials.js
```

### 2. 간단한 테스트

```javascript
// test-query.js
import { query } from '@anthropic-ai/claude-agent-sdk';

async function test() {
  try {
    console.log('Claude Agent SDK 테스트 시작...');

    const response = await query({
      prompt: "안녕하세요! 잘 작동하나요?",
      options: {
        model: 'claude-haiku-4-5-20251001' // 빠른 응답용
      }
    });

    console.log('✅ 응답 수신 성공!');
    console.log('응답:', response);
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

test();
```

실행:
```bash
node test-query.js
```

## 🐛 문제 해결

### 문제 1: "Could not find credentials" 오류

```
Error: Could not find credentials
```

**원인:** `ANTHROPIC_HOME` 경로에 `credentials.json` 파일이 없음

**해결책:**
1. Claude Code가 설치되어 있는지 확인
2. Claude Code에 로그인되어 있는지 확인
3. 환경 변수 경로가 올바른지 확인
   ```bash
   echo $ANTHROPIC_HOME  # macOS/Linux
   echo %ANTHROPIC_HOME%  # Windows
   ```

### 문제 2: "Permission denied" 오류

```
Error: EACCES: permission denied, open '/Users/john/.claude/credentials.json'
```

**원인:** 자격증명 파일에 대한 읽기 권한 없음

**해결책:**
```bash
# 파일 권한 확인
ls -l ~/.claude/credentials.json

# 권한 수정 (필요시)
chmod 600 ~/.claude/credentials.json
```

### 문제 3: 환경 변수가 인식되지 않음

**원인:** 서버 재시작이 필요하거나 환경 변수 로드 문제

**해결책:**
```bash
# 개발 서버 재시작
# Ctrl+C 후 다시 실행
npm run dev

# 환경 변수가 로드되는지 확인
console.log('ANTHROPIC_HOME:', process.env.ANTHROPIC_HOME);
```

### 문제 4: MCP 서버가 작동하지 않음

**원인:** MCP 서버 설정 파일 누락 또는 잘못된 경로

**해결책:**
1. MCP 서버 설정 파일 확인
   ```bash
   cat ~/.claude/mcp-servers.json
   ```

2. 환경 변수 확인
   ```bash
   echo $ENABLED_MCP_SERVERS
   ```

3. 서버 프로세스가 실행 가능한지 확인
   ```bash
   # 예: npx 명령어 확인
   which npx
   ```

## 📚 추가 리소스

### 공식 문서
- [Claude Agent SDK 문서](https://docs.claude.com/en/api/agent-sdk/overview)
- [Claude Code 가이드](https://docs.claude.com/en/docs/claude-code)
- [MCP 서버 가이드](https://docs.claude.com/en/docs/claude-code/mcp)

### 예제 프로젝트
- [Claude Agent Chat](https://github.com/anthropics/claude-agent-examples) - 공식 예제
- [이 프로젝트의 전체 구현](./README.md)

### 관련 가이드
- [권한 관리 상세 가이드](./PERMISSIONS.md)
- [MCP 서버 통합 가이드](./DASHBOARD_GUIDE.md)
- [실전 예제 모음](./EXAMPLES.md)

## 💡 팁과 모범 사례

### 1. 환경별 설정 분리

```javascript
// config.js
const isDevelopment = process.env.NODE_ENV === 'development';

export const claudeConfig = {
  // 개발: Claude Code 자격증명 사용
  // 프로덕션: API 키 사용
  useClaudeCodeCredentials: isDevelopment,

  model: isDevelopment
    ? 'claude-haiku-4-5-20251001'  // 빠른 응답
    : 'claude-opus-4-1-20250805',   // 고품질

  permissionMode: isDevelopment
    ? 'bypassPermissions'
    : 'default',
};
```

### 2. 에러 핸들링

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function safeQuery(prompt: string) {
  try {
    return await query({
      prompt,
      options: {
        model: 'claude-opus-4-1-20250805'
      }
    });
  } catch (error) {
    if (error.message.includes('credentials')) {
      console.error('자격증명 오류: ANTHROPIC_HOME 환경 변수를 확인하세요');
    } else if (error.message.includes('rate limit')) {
      console.error('사용량 한도 초과: 잠시 후 다시 시도하세요');
    } else {
      console.error('알 수 없는 오류:', error.message);
    }
    throw error;
  }
}
```

### 3. MCP 서버 동적 로딩

```typescript
// 성능 최적화: 필요한 MCP 서버만 로드
function loadRequiredMcpServers(requiredServers: string[]) {
  const allServers = loadMcpServers();

  return Object.fromEntries(
    Object.entries(allServers)
      .filter(([name]) => requiredServers.includes(name))
  );
}

// 사용 예시
const mcpServers = loadRequiredMcpServers(['sequential-thinking', 'context7']);
```

## 📝 체크리스트

새 프로젝트에 Claude Code 자격증명 설정 시 확인사항:

- [ ] Claude Code가 로컬에 ��치되어 있고 로그인됨
- [ ] `~/.claude/credentials.json` 파일 존재 확인
- [ ] `.env.local` 파일에 `ANTHROPIC_HOME` 설정
- [ ] `.gitignore`에 `.env.local` 추가
- [ ] `@anthropic-ai/claude-agent-sdk` 패키지 설치
- [ ] 권한 모드 및 허용 도구 설정
- [ ] 테스트 스크립트로 동작 확인
- [ ] (선택) MCP 서버 설정 로드 구현
- [ ] (선택) 플러그인/스킬 통합

## 🎉 결론

Claude Code 구독 계정을 활용하면 **별도의 API 키 없이** 다양한 프로젝트에서 Claude Agent SDK를 사용할 수 있습니다. 이 방식은 개발 및 테스트 환경에서 특히 유용하며, 로컬 Claude Code의 MCP 서버와 플러그인을 재사용할 수 있어 일관된 개발 경험을 제공합니다.

**다음 단계:**
1. 이 가이드를 참고하여 새 프로젝트에 적용
2. [PERMISSIONS.md](./PERMISSIONS.md)에서 권한 관리 방법 학습
3. [EXAMPLES.md](./EXAMPLES.md)에서 실전 예제 확인
4. 프로덕션 배포 시 별도 API 키 고려

**질문이나 문제가 있나요?**
- [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- [Claude Discord 커뮤니티](https://discord.gg/claude)
- [Anthropic 지원 센터](https://support.anthropic.com)

---

**작성일:** 2025-01-26
**버전:** 1.0
**업데이트:** Claude Agent SDK 0.1.27 기준
