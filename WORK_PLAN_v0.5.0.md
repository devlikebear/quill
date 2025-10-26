# Work Plan: v0.5.0 - DOCX 및 HTML 출력 형식 지원

**Issue**: #9
**Branch**: `feature/9-output-formats`
**Estimated Time**: 3-4 hours
**Priority**: High

## 목표

v0.3.0에서 Markdown 포맷터를 구현했습니다. 이제 사용자가 Word 문서(DOCX)와 웹 페이지(HTML) 형식으로도 문서를 생성할 수 있도록 추가 출력 형식을 지원합니다.

## 배경

현재 Quill은 Markdown 형식으로만 문서를 생성할 수 있습니다. 하지만 많은 사용자가 Word 문서나 웹 페이지 형식을 선호할 수 있습니다:

- **DOCX**: 기업 환경에서 가장 널리 사용되는 문서 형식
- **HTML**: 웹 브라우저에서 직접 열람 가능하고 공유가 쉬움

## 구현 계획

### 1. 의존성 추가

**설치할 패키지**:
```json
{
  "docx": "^8.5.0"  // Word 문서 생성
}
```

**선택 사항**:
- HTML은 순수 JavaScript/TypeScript로 구현 (추가 라이브러리 불필요)

### 2. DOCX Formatter 구현

**파일**: `src/output/formatters/docx.ts`

**핵심 기능**:
- `docx` 라이브러리를 사용한 Word 문서 생성
- 문서 메타데이터 (제목, 작성자, 날짜)
- 목차 (TOC) 자동 생성
- 섹션별 제목과 내용
- 스크린샷 이미지 임베딩
- UI 요소 목록 (테이블 또는 리스트)
- 전문적인 스타일 (폰트, 색상, 간격)

**주요 메서드**:
```typescript
export class DocxFormatter extends BaseFormatter {
  format(document: Document, options?: FormatterOptions): Buffer;

  private createDocument(document: Document, options: FormatterOptions): docx.Document;
  private createCoverPage(document: Document): docx.Paragraph[];
  private createTableOfContents(toc: TOC): docx.TableOfContents;
  private createSection(section: Section, options: FormatterOptions): docx.Paragraph[];
  private embedImage(imagePath: string): docx.ImageRun;
  private createElementList(elements: UIElement[]): docx.Table;
}
```

**스타일 가이드**:
- 제목: Calibri 24pt, Bold
- 부제목: Calibri 18pt, Bold
- 본문: Calibri 11pt
- 목록: 들여쓰기 1cm
- 이미지: 페이지 너비의 80%

### 3. HTML Formatter 구현

**파일**: `src/output/formatters/html.ts`

**핵심 기능**:
- HTML5 템플릿 생성
- 반응형 CSS 스타일 (모바일, 태블릿, 데스크톱)
- 사이드바 목차 (TOC) with smooth scrolling
- 섹션별 앵커 링크
- 스크린샷 이미지 임베딩 (base64 또는 상대 경로)
- UI 요소 목록 (HTML 테이블)
- 다크 모드 지원 (optional)
- 프린트 스타일 (PDF 변환 대비)

**주요 메서드**:
```typescript
export class HtmlFormatter extends BaseFormatter {
  format(document: Document, options?: FormatterOptions): string;

  private generateHtml(document: Document, options: FormatterOptions): string;
  private renderHead(document: Document): string;
  private renderStyles(): string;
  private renderTableOfContents(toc: TOC): string;
  private renderSection(section: Section, options: FormatterOptions): string;
  private renderImage(imagePath: string): string;
  private renderElementTable(elements: UIElement[]): string;
}
```

**HTML 구조**:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{document.title}</title>
  <style>/* CSS */</style>
</head>
<body>
  <nav class="sidebar">
    <!-- TOC -->
  </nav>
  <main class="content">
    <header>
      <h1>{document.title}</h1>
      <p>{document.metadata}</p>
    </header>
    <article>
      <!-- Sections -->
    </article>
  </main>
  <script>/* JavaScript for smooth scroll */</script>
</body>
</html>
```

**CSS 스타일**:
- 사이드바: 고정 위치, 스크롤 가능
- 본문: 최대 너비 1200px, 가운데 정렬
- 이미지: max-width 100%, 그림자 효과
- 테이블: 스타일링 (헤더 배경, 테두리)
- 반응형: 768px 이하에서 사이드바 숨김

### 4. CLI 통합

**파일**: `src/cli/commands/generate.ts`

**변경 사항**:
1. 포맷에 따른 포맷터 선택 로직
2. DOCX와 HTML 파일 저장 로직
3. 적절한 파일 확장자 사용

**구현 예시**:
```typescript
// Format document based on selected format
spinner.start('Formatting document...');

let outputPath: string;
let outputContent: string | Buffer;

switch (config.format) {
  case 'markdown': {
    const formatter = new MarkdownFormatter();
    outputContent = formatter.format(document, {
      includeToc: true,
      includeScreenshots: true,
      includeElements: true,
    });
    outputPath = path.join(outputDir, 'documentation.md');
    await saveTextFile(outputPath, outputContent as string);
    break;
  }

  case 'docx': {
    const formatter = new DocxFormatter();
    outputContent = formatter.format(document, {
      includeToc: true,
      includeScreenshots: true,
      includeElements: true,
    });
    outputPath = path.join(outputDir, 'documentation.docx');
    await fs.writeFile(outputPath, outputContent);
    break;
  }

  case 'html': {
    const formatter = new HtmlFormatter();
    outputContent = formatter.format(document, {
      includeToc: true,
      includeScreenshots: true,
      includeElements: true,
    });
    outputPath = path.join(outputDir, 'documentation.html');
    await saveTextFile(outputPath, outputContent as string);
    break;
  }

  default:
    throw new Error(`Unsupported format: ${config.format}`);
}

spinner.succeed(chalk.green('Document formatted!'));

// Display results
console.log(chalk.cyan(`\n✅ Documentation Generated:\n`));
console.log(chalk.green(`  📄 ${config.format.toUpperCase()}: ${outputPath}`));
```

### 5. 타입 정의 업데이트

**파일**: `src/types/index.ts`

**FormatterOptions 확장** (필요시):
```typescript
export interface FormatterOptions {
  includeToc?: boolean;
  includeScreenshots?: boolean;
  includeElements?: boolean;
  // DOCX specific
  author?: string;
  company?: string;
  // HTML specific
  darkMode?: boolean;
  embedImages?: boolean; // base64 vs relative paths
}
```

## 구현 순서

### Phase 1: 설정 및 DOCX 구현 (1.5시간)
1. ✅ 의존성 설치 (`npm install docx`)
2. ✅ `src/output/formatters/docx.ts` 생성
3. ✅ BaseFormatter 상속 및 format() 구현
4. ✅ 문서 메타데이터 및 커버 페이지
5. ✅ 목차 (TOC) 생성
6. ✅ 섹션 렌더링 (제목, 설명, 이미지)
7. ✅ UI 요소 테이블 생성
8. ✅ 스타일 적용

### Phase 2: HTML 구현 (1시간)
1. ✅ `src/output/formatters/html.ts` 생성
2. ✅ HTML 템플릿 구조
3. ✅ CSS 스타일 (반응형, 프린트)
4. ✅ 목차 사이드바
5. ✅ 섹션 렌더링
6. ✅ 이미지 임베딩
7. ✅ UI 요소 테이블
8. ✅ JavaScript (smooth scroll)

### Phase 3: CLI 통합 및 테스트 (1시간)
1. ✅ `generate.ts`에 포맷 선택 로직 추가
2. ✅ 각 포맷별 파일 저장 로직
3. ✅ 출력 경로 및 확장자 처리
4. ✅ 타입 체크 통과 확인
5. ✅ 빌드 테스트
6. ✅ 실제 문서 생성 테스트 (각 포맷)

### Phase 4: 문서화 및 정리 (0.5시간)
1. ✅ CHANGELOG.md 업데이트
2. ✅ package.json 버전 업데이트 (0.5.0)
3. ✅ README.md 업데이트 (사용 예시)
4. ✅ 코드 주석 및 JSDoc 추가

## 파일 구조

```
quill/
├── src/
│   ├── output/
│   │   └── formatters/
│   │       ├── base.ts              (기존)
│   │       ├── markdown.ts          (기존)
│   │       ├── docx.ts              (NEW)
│   │       └── html.ts              (NEW)
│   ├── cli/
│   │   └── commands/
│   │       └── generate.ts          (수정)
│   └── types/
│       └── index.ts                 (수정 - FormatterOptions)
├── package.json                     (수정 - 의존성)
├── CHANGELOG.md                     (수정)
└── README.md                        (수정)
```

## 예상 결과물

### DOCX 출력 예시
```
documentation.docx
├── Cover Page (제목, 메타데이터)
├── Table of Contents (자동 생성)
├── Section 1: Home Page
│   ├── Screenshot
│   ├── Description
│   └── UI Elements (Table)
├── Section 2: Dashboard
│   ├── Screenshot
│   ├── Description
│   └── UI Elements (Table)
└── ...
```

### HTML 출력 예시
```html
documentation.html (단일 파일, 모든 CSS/JS 포함)
├── Sidebar TOC (고정, 스크롤)
├── Main Content
│   ├── Header (제목, 날짜)
│   ├── Section 1
│   │   ├── Screenshot
│   │   ├── Description
│   │   └── UI Elements Table
│   └── ...
└── Footer
```

## 테스트 계획

### 1. 단위 테스트 (수동)
- [ ] DocxFormatter.format() 호출 시 Buffer 반환
- [ ] HtmlFormatter.format() 호출 시 HTML 문자열 반환
- [ ] TOC가 올바르게 생성되는지 확인
- [ ] 이미지 경로가 올바른지 확인

### 2. 통합 테스트
- [ ] `quill generate --url ... --format docx` 실행
- [ ] `quill generate --url ... --format html` 실행
- [ ] `quill generate --url ... --format markdown` 실행 (기존 기능 유지)
- [ ] 생성된 파일이 올바른 형식인지 확인

### 3. 품질 검증
- [ ] 타입 체크: `npm run type-check`
- [ ] 린트: `npm run lint`
- [ ] 빌드: `npm run build`
- [ ] DOCX 파일을 Word에서 열기
- [ ] HTML 파일을 브라우저에서 열기

## 의존성 관리

### 추가할 의존성
```json
{
  "dependencies": {
    "docx": "^8.5.0"
  }
}
```

### docx 라이브러리 선택 이유
- TypeScript 지원
- 활발한 유지보수 (주간 다운로드 100만+)
- 풍부한 기능 (TOC, 이미지, 테이블, 스타일)
- MIT 라이센스
- 좋은 문서화

### HTML 구현 방식
- 순수 TypeScript (추가 라이브러리 불필요)
- 템플릿 리터럴 사용
- 경량 및 빠른 성능
- 완전한 커스터마이징 가능

## 잠재적 이슈 및 해결 방안

### 이슈 1: DOCX 이미지 임베딩
**문제**: 이미지를 DOCX에 임베딩하려면 파일을 읽어야 함
**해결**:
```typescript
import * as fs from 'fs/promises';

private async embedImage(imagePath: string): Promise<docx.ImageRun> {
  const imageBuffer = await fs.readFile(imagePath);
  return new docx.ImageRun({
    data: imageBuffer,
    transformation: {
      width: 600,
      height: 400,
    },
  });
}
```

### 이슈 2: HTML 이미지 경로
**문제**: 절대 경로 vs 상대 경로 vs base64 임베딩
**해결**:
- 기본: 상대 경로 사용 (파일 크기 작음)
- 옵션: `embedImages: true` 시 base64 임베딩 (단일 파일)

### 이슈 3: 비동기 format() 메서드
**문제**: DOCX 이미지 임베딩은 비동기 작업
**해결**:
```typescript
// BaseFormatter 수정
export abstract class BaseFormatter {
  abstract format(document: Document, options?: FormatterOptions): Promise<string | Buffer> | string | Buffer;
}

// DocxFormatter
async format(document: Document, options?: FormatterOptions): Promise<Buffer> {
  // async operations
}
```

### 이슈 4: TOC 자동 업데이트
**문제**: Word의 TOC는 문서를 열 때 수동 업데이트 필요
**해결**:
- 사용자에게 "목차 업데이트" 안내 메시지 추가
- 또는 수동으로 TOC 항목 생성 (자동 업데이트 불필요)

## 수락 기준 (Definition of Done)

- [ ] DocxFormatter가 올바른 DOCX 파일을 생성
- [ ] HtmlFormatter가 올바른 HTML 파일을 생성
- [ ] CLI `--format` 옵션이 세 가지 형식 모두 지원
- [ ] 모든 포맷이 TOC, 섹션, 이미지, UI 요소 포함
- [ ] 타입 체크 및 린트 통과
- [ ] 빌드 성공
- [ ] 실제 웹사이트로 테스트하여 파일 생성 확인
- [ ] CHANGELOG.md 업데이트
- [ ] README.md 업데이트 (사용 예시)
- [ ] PR 생성 및 병합
- [ ] v0.5.0 태그 생성

## 타임라인

| 단계 | 예상 시간 | 완료 시간 |
|------|-----------|-----------|
| Phase 1: DOCX 구현 | 1.5시간 | |
| Phase 2: HTML 구현 | 1시간 | |
| Phase 3: CLI 통합 및 테스트 | 1시간 | |
| Phase 4: 문서화 및 정리 | 0.5시간 | |
| **총계** | **4시간** | |

## 참고 자료

### docx 라이브러리
- GitHub: https://github.com/dolanmiu/docx
- 문서: https://docx.js.org/
- 예시: https://github.com/dolanmiu/docx/tree/master/demo

### HTML/CSS 베스트 프랙티스
- MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/HTML
- Responsive Design: https://web.dev/responsive-web-design-basics/
- Print Styles: https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/

### 유사 프로젝트
- Scribe: 화면 녹화 기반 문서 자동 생성
- shot-scraper: Playwright 기반 스크린샷 자동화

## 다음 버전 계획

v0.6.0에서는 PDF 출력 형식을 추가할 계획입니다. HTML을 기반으로 puppeteer 또는 playwright의 PDF 생성 기능을 활용할 예정입니다.
