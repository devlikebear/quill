# Template System Guide

Quill v1.1.0부터 템플릿 시스템을 지원하여 문서 구조와 스타일을 자유롭게 커스터마이징할 수 있습니다.

## 📚 목차

- [빌트인 템플릿](#빌트인-템플릿)
- [템플릿 구조](#템플릿-구조)
- [커스텀 템플릿 만들기](#커스텀-템플릿-만들기)
- [Handlebars 헬퍼](#handlebars-헬퍼)
- [예제](#예제)

## 빌트인 템플릿

Quill은 3가지 빌트인 템플릿을 제공합니다:

### 1. user-guide (기본)
**대상**: 일반 사용자
**스타일**: 사용자 친화적, 시나리오 기반

```bash
quill generate --url https://example.com --template user-guide --multi-file
```

**특징:**
- Functional 스타일 UI 설명 ("Click 'Submit' to save your changes")
- 기능별 그룹화 (Authentication, Search, Navigation)
- 상세한 페이지별 가이드
- GNB/LNB 네비게이션 포함

**생성 파일:**
```
docs/
├── index.md
├── sitemap.md
├── navigation/
│   ├── global-navigation.md
│   └── local-navigation.md
├── pages/
│   └── [page-id]/
│       ├── overview.md
│       └── instructions.md
└── features/
    └── [feature-id].md
```

### 2. technical
**대상**: 개발자, 기술 담당자
**스타일**: 기술적, 구조 중심

```bash
quill generate --url https://example.com --template technical --multi-file
```

**특징:**
- Technical 스타일 UI 설명 ("button element (aria-label: submit)")
- DOM 구조 중심 설명
- 상세한 요소 타입 정보
- 간결한 페이지 구조

### 3. quick-start
**대상**: 빠른 시작이 필요한 사용자
**스타일**: 간결, 시나리오 기반

```bash
quill generate --url https://example.com --template quick-start --multi-file
```

**특징:**
- Scenario-based 스타일 UI 설명 ("When you want to save, click 'Submit'")
- 핵심 기능만 강조
- 빠른 시작 가이드
- 최소한의 파일 구조

**생성 파일:**
```
docs/
├── index.md
├── quick-start.md
├── pages/
│   └── [page-id]/
│       └── overview.md
└── features/
    └── [feature-id].md
```

## 템플릿 구조

템플릿은 YAML 형식으로 정의됩니다:

```yaml
# template.yaml
name: my-template
version: 1.0.0
description: My custom documentation template

# 디렉토리 구조
structure:
  directories:
    root: docs
    navigation: navigation
    pages: pages
    features: features
    assets: assets

  files:
    index: index.md
    sitemap: sitemap.md
    gnb: global-navigation.md
    lnb: local-navigation.md
    pageOverview: overview.md
    pageInstructions: instructions.md
    feature: "{{featureId}}.md"

# 섹션 정의
sections:
  - id: index
    title: Documentation Index
    template: |
      # {{metadata.title}}

      Generated on {{formatDate metadata.generatedAt}}
      Base URL: {{metadata.baseUrl}}

      ## Pages
      {{#each pages}}
      - [{{title}}]({{link url}})
      {{/each}}
    outputPath: "{{structure.directories.root}}/{{structure.files.index}}"

  # ... 추가 섹션

# 포맷 설정
format:
  uiElementsStyle: functional  # technical | functional | scenario-based
  includeScreenshots: true
  includeBreadcrumbs: true
  includePageToc: true
```

### 필수 필드

#### structure.directories
- `root`: 루트 디렉토리 (기본: `docs`)
- `navigation`: 네비게이션 파일 디렉토리 (선택)
- `pages`: 페이지별 파일 디렉토리 (선택)
- `features`: 기능별 파일 디렉토리 (선택)
- `assets`: 에셋 디렉토리 (선택)

#### structure.files
- `index`: 메인 인덱스 파일명 (필수)
- `sitemap`: 사이트맵 파일명 (선택)
- `gnb`: GNB 파일명 (선택)
- `lnb`: LNB 파일명 (선택)
- `pageOverview`: 페이지 개요 파일명 (선택)
- `pageInstructions`: 페이지 인스트럭션 파일명 (선택)
- `feature`: 기능 파일명 패턴 (선택)

#### format
- `uiElementsStyle`: UI 요소 설명 스타일 (`technical` | `functional` | `scenario-based`)
- `includeScreenshots`: 스크린샷 포함 여부
- `includeBreadcrumbs`: 브레드크럼 포함 여부
- `includePageToc`: 페이지 TOC 포함 여부

## 커스텀 템플릿 만들기

### 1. 템플릿 디렉토리 생성

```bash
mkdir -p templates/my-template
cd templates/my-template
```

### 2. template.yaml 작성

```yaml
name: my-template
version: 1.0.0
description: My custom template for internal documentation

structure:
  directories:
    root: internal-docs
    pages: pages

  files:
    index: README.md
    pageOverview: overview.md

sections:
  - id: index
    title: Internal Documentation
    template: |
      # {{metadata.title}}

      **Generated**: {{formatDate metadata.generatedAt}}
      **Site**: {{metadata.baseUrl}}

      ## Table of Contents

      {{#each sitemap.pages}}
      ### {{heading 3 title}}
      {{description}}

      - URL: {{link url}}
      {{#if children}}
      {{#each children}}
      - [{{title}}]({{link url}})
      {{/each}}
      {{/if}}
      {{/each}}
    outputPath: "{{structure.directories.root}}/{{structure.files.index}}"

  - id: page-overview
    title: "{{page.title}}"
    template: |
      # {{page.title}}

      **URL**: {{page.url}}
      **Last Updated**: {{formatDate metadata.generatedAt}}

      {{#if page.description}}
      ## Overview
      {{page.description}}
      {{/if}}

      {{#if page.screenshot}}
      ## Screenshot
      ![{{page.title}}]({{page.screenshot}})
      {{/if}}

      {{#if page.elements}}
      ## Interactive Elements

      {{#each page.elements}}
      ### {{text}}
      **Type**: {{code type}}
      **Action**: {{description}}
      {{/each}}
      {{/if}}
    outputPath: "{{structure.directories.root}}/{{structure.directories.pages}}/{{page.id}}/{{structure.files.pageOverview}}"
    repeat: pages

format:
  uiElementsStyle: functional
  includeScreenshots: true
  includeBreadcrumbs: false
  includePageToc: false
```

### 3. 템플릿 사용

```bash
quill generate \
  --url https://example.com \
  --multi-file \
  --custom-template-dir ./templates
```

## Handlebars 헬퍼

템플릿에서 사용 가능한 Handlebars 헬퍼:

### 날짜 포맷

```handlebars
{{formatDate metadata.generatedAt}}
```

**출력**: `2025년 10월 26일`

### 링크 생성

```handlebars
{{link page.url}}
{{link page.url "Click here"}}
```

**출력**:
- `[https://example.com](https://example.com)`
- `[Click here](https://example.com)`

### 제목 생성

```handlebars
{{heading 1 "Main Title"}}
{{heading 2 page.title}}
{{heading 3 feature.name}}
```

**출력**:
- `# Main Title`
- `## Page Title`
- `### Feature Name`

### 코드 블록

```handlebars
{{code "javascript" codeString}}
{{code "inline" element.type}}
```

**출력**:
- `` ```javascript\n...\n``` ``
- `` `button` ``

### 리스트 아이템

```handlebars
{{#each pages}}
{{listItem title 1}}
{{/each}}
```

**출력**: `- Page Title`

### 조건/비교

```handlebars
{{#if (eq format.uiElementsStyle "technical")}}
Technical documentation
{{/if}}

{{#if (length page.elements)}}
Has elements: {{length page.elements}}
{{/if}}
```

### 문자열 변환

```handlebars
{{uppercase page.title}}
{{lowercase feature.name}}
{{join page.links ", "}}
```

## 예제

### 최소 템플릿

```yaml
name: minimal
version: 1.0.0
description: Minimal single-file template

structure:
  directories:
    root: docs
  files:
    index: README.md

sections:
  - id: index
    title: Documentation
    template: |
      # Documentation

      {{#each pages}}
      ## {{title}}
      {{description}}

      {{#each elements}}
      - {{description}}
      {{/each}}

      {{/each}}
    outputPath: "{{structure.directories.root}}/{{structure.files.index}}"

format:
  uiElementsStyle: functional
  includeScreenshots: false
  includeBreadcrumbs: false
  includePageToc: false
```

### 고급 템플릿

빌트인 템플릿 파일 참고:
- [src/templates/builtin/user-guide.yaml](src/templates/builtin/user-guide.yaml)
- [src/templates/builtin/technical.yaml](src/templates/builtin/technical.yaml)
- [src/templates/builtin/quick-start.yaml](src/templates/builtin/quick-start.yaml)

## 템플릿 컨텍스트

템플릿에서 사용 가능한 데이터 구조:

```typescript
{
  metadata: {
    title: string;
    generatedAt: string;  // ISO 8601
    baseUrl: string;
    pageCount: number;
    version: string;
  },

  sitemap: {
    pages: Array<{
      id: string;
      title: string;
      url: string;
      description?: string;
      depth: number;
      children?: SitemapPage[];
    }>;
  },

  navigation: {
    gnb: Array<{
      id: string;
      title: string;
      url: string;
      active: boolean;
    }>;
    lnb: Array<{
      id: string;
      title: string;
      url: string;
      parentId?: string;
      active: boolean;
    }>;
  },

  pages: Array<{
    id: string;
    title: string;
    url: string;
    description?: string;
    screenshot?: string;
    elements?: Array<{
      type: string;
      text: string;
      description: string;
    }>;
  }>,

  features: Array<{
    id: string;
    name: string;
    description: string;
    pages: string[];  // page IDs
    elements: Array<{
      type: string;
      text: string;
      description: string;
    }>;
    scenario?: string;  // scenario-based만
  }>,

  structure: {
    // template.yaml의 structure 정의
  }
}
```

## 문의 및 기여

- Issue: https://github.com/devlikebear/quill/issues
- Pull Request: https://github.com/devlikebear/quill/pulls

템플릿 예제를 공유하고 싶으시면 PR을 보내주세요!
