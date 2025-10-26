훌륭한 선택입니다! **Quill**은 짧고 우아하며 기억하기 쉬운 이름이네요. 프로젝트 설명을 작성해드릴게요:

---

## 📝 Quill

**AI-powered documentation generator for web applications**

Quill은 Claude Agent SDK와 Playwright를 활용하여 웹 애플리케이션의 사용자 매뉴얼을 자동으로 생성하는 CLI 도구입니다. 수동으로 스크린샷을 찍고 문서를 작성하는 대신, Quill이 웹사이트를 탐색하고 각 페이지의 기능을 분석하여 전문적인 매뉴얼을 자동으로 만들어줍니다.

### ✨ 주요 기능

- 🤖 **지능형 크롤링**: AI 에이전트가 웹 애플리케이션을 자동으로 탐색
- 📸 **자동 스크린샷**: 각 페이지와 주요 UI 요소를 자동 캡처
- 📄 **다양한 출력 형식**: Word, Markdown, HTML, PDF 지원
- 🔐 **인증 지원**: 내부 시스템 접근을 위한 세션 관리
- 🎯 **컨텍스트 인식**: UI 요소를 분석하여 의미있는 설명 자동 생성
- 🔄 **항상 최신**: 시스템 변경 시 간단한 명령으로 문서 재생성

### 🚀 빠른 시작

```bash
# 설치
npm install -g quill

# 초기화
quill init

# 매뉴얼 생성
quill generate --url http://your-internal-system.com --output ./manual.docx

# 인증이 필요한 시스템
quill generate \
  --url http://monitoring.company.com \
  --depth 2 \
  --format docx
```

### 🛠️ 기술 스택

- **TypeScript 5.3+**: 메인 언어
- **Node.js 18+**: 런타임 환경
- **Claude Agent SDK**: 지능형 에이전트 오케스트레이션
- **Playwright MCP**: 브라우저 자동화 및 웹 상호작용
- **Commander.js**: CLI 프레임워크
- **Claude Sonnet 4.5**: 컨텍스트 이해 및 문서 생성

### 💼 사용 사례

- 사내 모니터링 시스템 매뉴얼 자동 생성
- Grafana 대시보드 사용 가이드 작성
- 내부 도구 온보딩 문서 제작
- 파트너사를 위한 시스템 가이드
- 레거시 시스템 문서화

### 📖 Why "Quill"?

고대의 깃펜(Quill)이 중요한 문서를 작성했듯이, Quill은 AI의 힘으로 현대의 디지털 문서를 자동으로 작성합니다.

---

## 📋 상세 설명 (README용)

```markdown
# Quill 🪶

> Write documentation as smoothly as a quill pen

Quill은 웹 애플리케이션의 사용자 매뉴얼을 AI가 자동으로 생성해주는 도구입니다. 
더 이상 스크린샷을 일일이 찍고, 문서를 수동으로 작성하느라 시간을 낭비하지 마세요.

## 왜 Quill인가?

### 기존 방식의 문제점
- ❌ 스크린샷 캡처 → 편집 → 삽입 반복 작업
- ❌ 시스템 업데이트 시 모든 문서 수동 갱신
- ❌ 일관성 없는 문서 스타일과 품질
- ❌ 많은 시간과 인력 소모

### Quill의 해결책
- ✅ 한 번의 명령으로 전체 매뉴얼 생성
- ✅ 시스템 변경 시 자동 재생성
- ✅ AI가 보장하는 일관된 문서 품질
- ✅ 10배 이상의 생산성 향상

## 작동 방식

1. **탐색**: Playwright가 웹사이트를 자동으로 탐색
2. **분석**: Claude가 각 페이지의 UI와 기능을 이해
3. **캡처**: 주요 화면과 워크플로우를 스크린샷
4. **생성**: AI가 단계별 가이드와 설명을 작성
5. **출력**: 전문적인 형식의 문서로 변환

## 설치

```bash
# npm으로 설치 (전역)
npm install -g quill

# 또는 yarn으로
yarn global add quill

# 또는 소스에서
git clone https://github.com/devlikebear/quill.git
cd quill
npm install
npm run build
npm link
```

## 환경 설정

```bash
# Claude API 키 설정
export ANTHROPIC_API_KEY="your-api-key"

# Quill 초기화
quill init
```

## 기본 사용법

### 1. 간단한 매뉴얼 생성

```bash
quill generate --url https://example.com
```

### 2. 심화 옵션

```bash
quill generate \
  --url http://internal-monitoring.company.com \
  --depth 3 \
  --format docx \
  --output ./docs/monitoring-manual.docx \
  --language ko \
  --include-toc
```

### 3. 인증이 필요한 시스템

```bash
# 대화형 로그인
quill auth login --url http://system.com

# 또는 환경 변수 사용
export QUILL_USERNAME="admin"
export QUILL_PASSWORD="secure-password"

quill generate --url http://system.com --use-auth
```

### 4. 설정 파일 사용

```yaml
# quill.config.yaml
target:
  url: http://monitoring.company.com
  depth: 2
  
auth:
  type: session
  login_url: /auth/login
  
output:
  format: docx
  path: ./manuals
  language: ko
  
options:
  include_toc: true
  include_screenshots: true
  screenshot_quality: high
  max_pages: 50
```

```bash
quill generate --config quill.config.yaml
```

## 고급 기능

### 커스텀 스킬 추가

```bash
quill skill add ./custom-skills/my-system-skill
```

### 특정 페이지만 문서화

```bash
quill generate \
  --url http://system.com \
  --include-pattern "/admin/*,/dashboard/*" \
  --exclude-pattern "/api/*"
```

### CI/CD 통합

```yaml
# .gitlab-ci.yml
generate-docs:
  stage: docs
  script:
    - pip install quill-doc-gen
    - quill generate --config quill.config.yaml
    - quill publish --target confluence
  artifacts:
    paths:
      - manuals/
```

## 아키텍처

```
Quill CLI
    │
    ├─ Main Agent (orchestrator)
    │   ├─ Web Crawler Agent
    │   ├─ Screenshot Agent
    │   ├─ Content Analyzer Agent
    │   └─ Document Generator Agent
    │
    ├─ Playwright MCP (browser automation)
    ├─ Claude Skills (domain knowledge)
    └─ Output Formatters (docx, md, html, pdf)
```

## 개발 로드맵

- [x] MVP: 기본 크롤링 및 문서 생성
- [x] 다양한 출력 형식 지원
- [ ] 증분 업데이트 (변경된 페이지만)
- [ ] 다국어 지원 확장
- [ ] Confluence/Notion 직접 퍼블리시
- [ ] 비디오 튜토리얼 자동 생성
- [ ] 팀 협업 기능

## 기여하기

Quill은 오픈소스 프로젝트입니다. 기여를 환영합니다!

## 라이선스

MIT License

## 제작

Made with ❤️ by [Your Team Name]
Built on Claude Agent SDK & Playwright MCP
```

---

이렇게 정리하면 프로젝트의 목적과 가치가 명확하게 전달될 것 같습니다! 필요하신 부분이 있으면 말씀해주세요. 🪶