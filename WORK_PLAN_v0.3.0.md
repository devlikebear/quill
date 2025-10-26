# 작업 계획: Document Generation with Markdown Formatter (#5)

## 📋 요구사항 요약

수집된 페이지 데이터를 기반으로 실제 Markdown 문서를 생성하는 기능을 구현합니다.

## 🎯 프로젝트 목표

- **현재 버전**: v0.2.0 (웹 크롤링 및 데이터 수집)
- **목표 버전**: v0.3.0 (문서 생성)
- **핵심 기능**: Document Generator + Markdown Formatter

## 🏗️ 아키텍처 설계

### 데이터 흐름

```
PageInfo[] (수집된 데이터)
    ↓
Document Generator (구조화)
    ↓
Document (중간 표현)
    ↓
Markdown Formatter (변환)
    ↓
Markdown 텍스트
    ↓
파일 저장
```

### 컴포넌트 구조

```
Document Generation v0.3.0
│
├── Document Generator Agent
│   ├── TOC 생성
│   ├── 섹션 구조화
│   └── 메타데이터 추출
│
├── Formatters
│   ├── Base Formatter (인터페이스)
│   └── Markdown Formatter (구현)
│
└── Utilities
    ├── File Utils
    └── Template System
```

## 📦 영향 범위 분석

### 생성할 파일

**타입 정의:**
- `src/types/index.ts` (수정) - Document, Section, TOC 타입 추가

**에이전트:**
- `src/agent/subagents/document-generator.ts` - 문서 생성 에이전트

**포맷터:**
- `src/output/formatters/base.ts` - 베이스 포맷터 인터페이스
- `src/output/formatters/markdown.ts` - Markdown 포맷터

**유틸리티:**
- `src/utils/file-utils.ts` - 파일 시스템 헬퍼

### 수정할 파일

- `src/agent/main-agent.ts` - 문서 생성 통합
- `src/cli/commands/generate.ts` - 문서 저장 추가
- `package.json` - 버전 업데이트 (0.3.0)
- `CHANGELOG.md` - 변경 이력 추가

## ✅ 작업 체크리스트

### 1. 준비 작업
- [x] Issue #5 확인
- [x] 작업 계획 수립
- [ ] 기존 코드 분석

### 2. 브랜치 생성
- [ ] `feature/5-document-generation-markdown` 브랜치 생성
- [ ] 브랜치 원격 푸시

### 3. 타입 정의 확장
- [ ] Document 타입 정의
- [ ] Section 타입 정의
- [ ] TOC 타입 정의
- [ ] FormatterOptions 타입 정의

### 4. Document Generator 구현
- [ ] DocumentGenerator 클래스 구조
- [ ] TOC 생성 로직
  - [ ] 페이지 제목 수집
  - [ ] 계층 구조 생성
  - [ ] 앵커 링크 생성
- [ ] 섹션 구조화
  - [ ] 페이지 정보 → Section 변환
  - [ ] 스크린샷 경로 처리
  - [ ] UI 요소 설명 생성
- [ ] Document 통합
  - [ ] 메타데이터 추가
  - [ ] 섹션 병합
  - [ ] 최종 Document 반환

### 5. Base Formatter 구현
- [ ] Formatter 인터페이스 정의
- [ ] format() 메서드 시그니처
- [ ] 공통 유틸리티 메서드

### 6. Markdown Formatter 구현
- [ ] MarkdownFormatter 클래스
- [ ] TOC 포맷팅
  - [ ] 목차 헤더
  - [ ] 링크 리스트
  - [ ] 구분선
- [ ] Section 포맷팅
  - [ ] 헤더 생성
  - [ ] URL 및 제목 표시
  - [ ] 스크린샷 이미지 링크
  - [ ] UI 요소 리스트
- [ ] 특수 문자 이스케이프
- [ ] 전체 문서 조합

### 7. File Utilities 구현
- [ ] 파일 저장 함수
- [ ] 디렉토리 생성 보장
- [ ] 파일명 생성 (타임스탬프)
- [ ] 상대 경로 처리

### 8. Main Agent 통합
- [ ] DocumentGenerator 인스턴스 생성
- [ ] 크롤링 후 문서 생성 호출
- [ ] 포맷터 선택 로직
- [ ] 파일 저장

### 9. CLI 개선
- [ ] `--format` 옵션 실제 동작
- [ ] 출력 파일 경로 표시
- [ ] 문서 생성 진행 상황
- [ ] 생성 완료 메시지

### 10. 빌드 및 검증
- [ ] TypeScript 타입 체크
- [ ] ESLint 검사
- [ ] 빌드 테스트
- [ ] 실제 문서 생성 테스트

### 11. 문서 갱신
- [ ] package.json 버전 (0.3.0)
- [ ] CHANGELOG.md 업데이트
- [ ] README.md 사용 예시 추가

### 12. PR 생성 및 병합
- [ ] 커밋 및 푸시
- [ ] Pull Request 생성
- [ ] main 브랜치 병합
- [ ] 릴리즈 태그 생성 (v0.3.0)

## ⏱️ 예상 소요 시간

- **타입 정의**: 30분
- **Document Generator**: 2시간
- **Formatters**: 2시간
- **File Utils**: 30분
- **Main Agent 통합**: 1시간
- **CLI 개선**: 1시간
- **테스트 및 검증**: 1시간
- **문서 갱신**: 30분
- **총 예상**: 8.5시간

## 🔑 핵심 구현 내용

### Document 타입 정의

```typescript
interface Document {
  title: string;
  metadata: {
    generatedAt: string;
    baseUrl: string;
    pageCount: number;
  };
  toc: TOC;
  sections: Section[];
}

interface TOC {
  items: TOCItem[];
}

interface TOCItem {
  title: string;
  anchor: string;
  depth: number;
}

interface Section {
  id: string;
  title: string;
  url: string;
  description?: string;
  screenshot?: string;
  elements?: UIElement[];
}
```

### Document Generator 예시

```typescript
class DocumentGenerator {
  generate(pages: PageInfo[]): Document {
    return {
      title: 'Web Application Documentation',
      metadata: {
        generatedAt: new Date().toISOString(),
        baseUrl: pages[0]?.url ?? '',
        pageCount: pages.length,
      },
      toc: this.buildTOC(pages),
      sections: pages.map(page => this.buildSection(page)),
    };
  }

  private buildTOC(pages: PageInfo[]): TOC {
    return {
      items: pages.map((page, index) => ({
        title: page.title,
        anchor: `page-${index + 1}`,
        depth: 1,
      })),
    };
  }

  private buildSection(page: PageInfo): Section {
    return {
      id: page.url,
      title: page.title,
      url: page.url,
      description: page.description,
      screenshot: page.screenshot,
      elements: page.elements,
    };
  }
}
```

### Markdown Formatter 예시

```typescript
class MarkdownFormatter {
  format(document: Document): string {
    const parts: string[] = [];

    // Title
    parts.push(`# ${document.title}\n`);

    // Metadata
    parts.push(`Generated: ${document.metadata.generatedAt}\n`);
    parts.push(`Total Pages: ${document.metadata.pageCount}\n`);

    // TOC
    parts.push('\n## Table of Contents\n');
    for (const item of document.toc.items) {
      parts.push(`- [${item.title}](#${item.anchor})\n`);
    }

    // Sections
    for (const section of document.sections) {
      parts.push(`\n---\n\n## ${section.title}\n\n`);
      parts.push(`**URL**: ${section.url}\n\n`);

      if (section.screenshot) {
        parts.push(`### Screenshot\n![${section.title}](${section.screenshot})\n\n`);
      }

      if (section.elements && section.elements.length > 0) {
        parts.push(`### UI Elements\n`);
        for (const element of section.elements) {
          parts.push(`- **${element.type}**: ${element.label}\n`);
        }
      }
    }

    return parts.join('');
  }
}
```

## 📊 예상 출력 예시

```markdown
# Web Application Documentation

Generated: 2024-10-26T12:00:00.000Z
Total Pages: 3

## Table of Contents
- [Example Domain](#page-1)
- [About Us](#page-2)
- [Contact](#page-3)

---

## Example Domain

**URL**: https://example.com/

### Screenshot
![Example Domain](./output/screenshots/example-com.png)

### UI Elements
- **link**: More information...

---

## About Us

**URL**: https://example.com/about

### Screenshot
![About Us](./output/screenshots/example-com-about.png)

### UI Elements
- **button**: Learn More
- **link**: Back to Home

---

## Contact

**URL**: https://example.com/contact

### Screenshot
![Contact](./output/screenshots/example-com-contact.png)

### UI Elements
- **input**: Name
- **input**: Email
- **button**: Submit
```

## ⚠️ 주의사항

- **상대 경로 처리**: 스크린샷 경로를 상대 경로로 변환
- **특수 문자**: Markdown 특수 문자 이스케이프 필요
- **긴 목차**: 페이지가 많을 경우 목차 페이지네이션 고려
- **이미지 경로**: 생성된 문서 위치를 고려한 상대 경로

## 🚀 다음 단계 (v0.4.0 계획)

1. DOCX 포맷터 구현
2. HTML 포맷터 구현
3. PDF 포맷터 구현 (puppeteer)
4. Claude Agent SDK를 활용한 AI 문서 개선
5. 설정 파일 지원 (quill.config.yaml)
