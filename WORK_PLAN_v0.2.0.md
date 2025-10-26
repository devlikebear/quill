# 작업 계획: Implement Playwright MCP integration and web crawler (#3)

## 📋 요구사항 요약

Quill의 핵심 기능인 Playwright MCP 통합과 웹 크롤러를 구현하여 실제로 웹 애플리케이션을 탐색하고 정보를 수집할 수 있도록 합니다.

## 🎯 프로젝트 목표

- **현재 버전**: v0.1.0 (TypeScript 프로젝트 초기화)
- **목표 버전**: v0.2.0 (핵심 기능 구현)
- **핵심 기능**: Playwright MCP 통합 + 웹 크롤러

## 🏗️ 아키텍처 설계

### 컴포넌트 구조

```
Quill v0.2.0
│
├── CLI Layer (사용자 인터페이스)
│   └── generate 명령어
│
├── Main Agent (오케스트레이터)
│   ├── 워크플로우 조정
│   └── 서브 에이전트 관리
│
├── MCP Integration (브라우저 자동화)
│   ├── Playwright MCP 서버 연결
│   ├── 브라우저 인스턴스 관리
│   └── 페이지 조작 API
│
└── Sub-Agents (전문 에이전트)
    ├── Web Crawler Agent
    │   ├── URL 탐색
    │   ├── 링크 추출
    │   └── 깊이 제한 크롤링
    │
    └── Screenshot Agent
        ├── 페이지 스크린샷
        └── 이미지 저장
```

### 데이터 흐름

```
사용자 입력 (URL, depth, options)
    ↓
CLI (generate 명령어)
    ↓
Main Agent (워크플로우 시작)
    ↓
Playwright MCP (브라우저 시작)
    ↓
Web Crawler Agent (페이지 탐색)
    ↓
Screenshot Agent (화면 캡처)
    ↓
페이지 정보 수집 및 저장
    ↓
결과 반환
```

## 📦 영향 범위 분석

### 생성할 파일

**서브 에이전트:**
- `src/agent/subagents/web-crawler.ts` - 웹 크롤러 에이전트
- `src/agent/subagents/screenshot.ts` - 스크린샷 에이전트

**유틸리티:**
- `src/utils/logger.ts` - 로깅 유틸리티
- `src/utils/url-utils.ts` - URL 처리 유틸리티

**테스트:**
- `tests/unit/web-crawler.test.ts` - 크롤러 단위 테스트
- `tests/unit/playwright-mcp.test.ts` - MCP 통합 테스트
- `tests/integration/generate.test.ts` - 통합 테스트

### 수정할 파일

- `src/mcp/playwright.ts` - Playwright MCP 통합 실제 구현
- `src/agent/main-agent.ts` - 서브 에이전트 통합
- `src/cli/commands/generate.ts` - 실제 동작 구현
- `package.json` - 버전 업데이트 (0.2.0)
- `CHANGELOG.md` - 변경 이력 추가

## ✅ 작업 체크리스트

### 1. 준비 작업
- [x] Issue #3 확인
- [x] 작업 계획 수립
- [ ] 기존 코드 분석

### 2. 브랜치 생성
- [ ] `feature/3-playwright-mcp-web-crawler` 브랜치 생성
- [ ] 브랜치 원격 푸시

### 3. 유틸리티 구현
- [ ] Logger 유틸리티 구현
  - [ ] 로그 레벨 (debug, info, warn, error)
  - [ ] 색상 출력 (chalk)
  - [ ] 타임스탬프
- [ ] URL 유틸리티 구현
  - [ ] URL 정규화
  - [ ] 도메인 검증
  - [ ] 상대 URL → 절대 URL 변환
  - [ ] URL 필터링 (같은 도메인만)

### 4. Playwright MCP 통합 구현
- [ ] MCP 서버 프로세스 관리
  - [ ] stdio 기반 통신 설정
  - [ ] 프로세스 시작/종료
  - [ ] 에러 핸들링
- [ ] 브라우저 인스턴스 관리
  - [ ] Chromium 브라우저 시작
  - [ ] 페이지 컨텍스트 생성
  - [ ] 리소스 정리
- [ ] 페이지 조작 API
  - [ ] `navigate(url)` - 페이지 이동
  - [ ] `screenshot(path)` - 스크린샷 캡처
  - [ ] `extractLinks()` - 링크 추출
  - [ ] `getPageInfo()` - 페이지 정보 수집
  - [ ] `close()` - 브라우저 종료

### 5. 웹 크롤러 에이전트 구현
- [ ] 크롤러 클래스 구조
  - [ ] 큐 기반 URL 관리
  - [ ] 방문 이력 Set
  - [ ] 깊이 추적 (depth tracking)
- [ ] 크롤링 로직
  - [ ] BFS 알고리즘 구현
  - [ ] 같은 도메인 필터링
  - [ ] 최대 페이지 수 제한
  - [ ] 진행 상태 추적
- [ ] 페이지 정보 수집
  - [ ] 페이지 제목
  - [ ] 메타 설명
  - [ ] 링크 목록
  - [ ] 스크린샷 경로

### 6. 스크린샷 에이전트 구현
- [ ] 스크린샷 캡처 로직
  - [ ] 전체 페이지 스크린샷
  - [ ] 뷰포트 설정
  - [ ] 이미지 품질 옵션
- [ ] 파일 저장
  - [ ] 출력 디렉토리 생성
  - [ ] 파일명 생성 (URL 기반)
  - [ ] 경로 반환

### 7. 메인 에이전트 개선
- [ ] 서브 에이전트 통합
  - [ ] WebCrawlerAgent 인스턴스 생성
  - [ ] ScreenshotAgent 인스턴스 생성
  - [ ] 에이전트 간 통신
- [ ] 워크플로우 오케스트레이션
  - [ ] MCP 초기화
  - [ ] 크롤러 시작
  - [ ] 페이지별 처리
  - [ ] 스크린샷 캡처
  - [ ] 결과 수집

### 8. CLI 개선
- [ ] `generate` 명령어 실제 구현
  - [ ] MainAgent 인스턴스 생성
  - [ ] 워크플로우 실행
  - [ ] 진행 상태 표시 (ora)
  - [ ] 에러 핸들링
  - [ ] 결과 출력

### 9. 테스트 작성
- [ ] 단위 테스트
  - [ ] URL 유틸리티 테스트
  - [ ] Logger 테스트
  - [ ] WebCrawlerAgent 테스트
  - [ ] ScreenshotAgent 테스트
- [ ] 통합 테스트
  - [ ] Playwright MCP 연결 테스트
  - [ ] End-to-end 크롤링 테스트
- [ ] 테스트 실행 및 통과 확인

### 10. 코드 품질 검증
- [ ] TypeScript 타입 체크
- [ ] ESLint 검사
- [ ] Prettier 포맷팅
- [ ] 빌드 테스트

### 11. 문서 갱신
- [ ] README.md 업데이트
  - [ ] 사용 예시 추가
  - [ ] 실제 동작 설명
- [ ] CHANGELOG.md 업데이트
  - [ ] v0.2.0 항목 추가
  - [ ] 주요 변경사항 기록
- [ ] package.json 버전 업데이트 (0.2.0)

### 12. 커밋 및 푸시
- [ ] 변경사항 커밋
- [ ] 원격 브랜치에 푸시

### 13. PR 생성 및 병합
- [ ] Pull Request 생성
- [ ] PR 설명 작성
- [ ] 코드 리뷰 (자체 리뷰)
- [ ] main 브랜치 병합
- [ ] 릴리즈 태그 생성 (v0.2.0)
- [ ] 브랜치 정리

## ⏱️ 예상 소요 시간

- **유틸리티 구현**: 1시간
- **Playwright MCP 통합**: 2시간
- **웹 크롤러 구현**: 3시간
- **스크린샷 에이전트**: 1시간
- **메인 에이전트 개선**: 1시간
- **CLI 개선**: 1시간
- **테스트 작성**: 2시간
- **문서 갱신**: 1시간
- **총 예상**: 12시간

## 🔑 핵심 구현 내용

### Playwright MCP 통합 예시

```typescript
// MCP 서버 프로세스 시작
const mcpProcess = spawn('npx', ['@playwright/mcp'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// stdio 통신으로 브라우저 제어
mcpProcess.stdin.write(JSON.stringify({
  method: 'browser.navigate',
  params: { url: 'https://example.com' }
}));
```

### 웹 크롤러 알고리즘

```typescript
// BFS 기반 크롤링
const queue: Array<{url: string, depth: number}> = [{url: startUrl, depth: 0}];
const visited = new Set<string>();
const results: PageInfo[] = [];

while (queue.length > 0 && results.length < maxPages) {
  const {url, depth} = queue.shift()!;

  if (depth > maxDepth || visited.has(url)) continue;

  visited.add(url);

  // 페이지 방문 및 정보 수집
  const pageInfo = await crawlPage(url);
  results.push(pageInfo);

  // 링크 추출 및 큐에 추가
  for (const link of pageInfo.links) {
    if (isSameDomain(link, startUrl)) {
      queue.push({url: link, depth: depth + 1});
    }
  }
}
```

## ⚠️ 주의사항

- **메모리 관리**: 브라우저 인스턴스는 메모리를 많이 사용하므로 적절히 종료
- **에러 핸들링**: 네트워크 오류, 타임아웃 등 다양한 에러 케이스 처리
- **크롤링 예의**: robots.txt 준수, rate limiting 고려
- **리소스 정리**: try-finally 또는 async cleanup으로 리소스 해제 보장
- **타임아웃**: 각 페이지 로딩에 타임아웃 설정

## 🚀 다음 단계 (v0.3.0 계획)

1. UI 요소 분석 에이전트
2. Claude Agent SDK를 활용한 문서 생성
3. 다양한 출력 포맷 (DOCX, HTML, PDF)
4. 인증 지원 (세션 기반)
