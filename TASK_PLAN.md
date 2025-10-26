# 작업 계획: Template-based Multi-file Documentation Generator (#14)

## 📋 요구사항 요약

현재 Quill의 단일 파일 문서 생성을 개선하여 전문적인 웹 서비스 매뉴얼 생성 시스템으로 발전시킵니다.

### 핵심 목표
1. **템플릿 시스템**: 커스텀 + 빌트인 템플릿 지원
2. **구조화된 다중 파일**: 사이트맵, 네비게이션, 페이지별 문서
3. **사용자 친화적 콘텐츠**: 기능 중심 설명 (UI Elements 개선)
4. **부분 업데이트**: 페이지 단위 선택적 갱신

---

## 🔍 영향 범위 분석

### 생성할 파일

#### 템플릿 시스템
- `src/templates/types.ts` - 템플릿 타입 정의
- `src/templates/loader.ts` - 템플릿 로딩 및 파싱
- `src/templates/builtin/user-guide.yaml` - 사용자 가이드 템플릿
- `src/templates/builtin/technical.yaml` - 기술 문서 템플릿
- `src/templates/builtin/quick-start.yaml` - 빠른 시작 템플릿
- `src/templates/engine.ts` - 템플릿 엔진 (렌더링)

#### 다중 파일 생성
- `src/output/generators/multi-file-generator.ts` - 다중 파일 생성 로직
- `src/output/generators/sitemap-generator.ts` - 사이트맵 생성
- `src/output/generators/navigation-generator.ts` - 네비게이션 생성
- `src/output/generators/feature-generator.ts` - 기능별 문서 생성

#### Update 명령어
- `src/cli/commands/update.ts` - 부분 업데이트 명령어
- `src/agent/subagents/page-updater.ts` - 페이지 업데이트 로직

#### 테스트
- `__tests__/templates/loader.test.ts` - 템플릿 로더 테스트
- `__tests__/generators/multi-file.test.ts` - 다중 파일 생성 테스트
- `__tests__/commands/update.test.ts` - update 명령어 테스트

### 수정할 파일

- `src/types/index.ts` - 템플릿, 다중 파일 관련 타입 추가
- `src/cli/commands/generate.ts` - 템플릿 옵션 추가
- `src/cli/index.ts` - update 명령어 등록
- `src/agent/subagents/document-generator.ts` - 다중 파일 지원
- `src/agent/main-agent.ts` - 프롬프트 개선 (기능 중심)
- `package.json` - 버전 업데이트 (1.0.0 → 1.1.0), 의존성 추가
- `README.md` - 템플릿 사용법, update 명령어 설명
- `CHANGELOG.md` - v1.1.0 항목 추가

### 영향받는 영역

- **문서 생성 워크플로우**: 단일 파일 → 다중 파일 구조
- **CLI 인터페이스**: 새로운 옵션 및 명령어
- **출력 형식**: 템플릿 기반 동적 구조
- **콘텐츠 품질**: UI Elements → 기능 중심 설명

---

## ✅ 작업 체크리스트

### Phase 1: 템플릿 시스템 (4h)

#### 1.1 준비 작업
- [x] Issue #14 확인
- [ ] 템플릿 스키마 설계
- [ ] 디렉토리 구조 설계

#### 1.2 템플릿 타입 정의
- [ ] `src/templates/types.ts` 작성
  - [ ] `TemplateDefinition` 인터페이스
  - [ ] `TemplateSection` 타입
  - [ ] `BuiltinTemplate` enum
- [ ] `src/types/index.ts` 확장
  - [ ] 템플릿 관련 타입 export

#### 1.3 빌트인 템플릿 작성
- [ ] `user-guide.yaml` - 사용자 가이드
  ```yaml
  name: user-guide
  description: End-user documentation template
  structure:
    - index
    - sitemap
    - navigation
    - pages
    - features
  sections:
    pages:
      - overview
      - instructions
  ```
- [ ] `technical.yaml` - 기술 문서
- [ ] `quick-start.yaml` - 빠른 시작

#### 1.4 템플릿 로더 구현
- [ ] `src/templates/loader.ts`
  - [ ] YAML 파싱 기능
  - [ ] 빌트인 템플릿 로딩
  - [ ] 커스텀 템플릿 로딩
  - [ ] 템플릿 검증 로직

---

### Phase 2: 다중 파일 생성 (6h)

#### 2.1 기본 구조 생성기
- [ ] `src/output/generators/multi-file-generator.ts`
  - [ ] 디렉토리 구조 생성
  - [ ] 템플릿 기반 파일 분할
  - [ ] 파일 저장 로직

#### 2.2 사이트맵 생성기
- [ ] `src/output/generators/sitemap-generator.ts`
  - [ ] 전체 페이지 구조 분석
  - [ ] 계층 구조 생성 (GNB/LNB)
  - [ ] Markdown 사이트맵 생성

#### 2.3 네비게이션 생성기
- [ ] `src/output/generators/navigation-generator.ts`
  - [ ] GNB (Global Navigation) 생성
  - [ ] LNB (Local Navigation) 생성
  - [ ] 브레드크럼 정보 추가

#### 2.4 페이지/기능 생성기
- [ ] `src/output/generators/feature-generator.ts`
  - [ ] UI Elements → 기능 중심 변환
  - [ ] 페이지별 overview 생성
  - [ ] 인스트럭션 생성

#### 2.5 통합
- [ ] `src/agent/subagents/document-generator.ts` 수정
  - [ ] `generateMultiFile()` 메서드 추가
  - [ ] 템플릿 적용 로직
  - [ ] 기존 단일 파일 생성 유지 (레거시 모드)

---

### Phase 3: 콘텐츠 개선 (4h)

#### 3.1 Agent 프롬프트 개선
- [ ] `src/agent/main-agent.ts` 수정
  - [ ] 기능 중심 정보 추출 프롬프트
  - [ ] 사용자 시나리오 기반 설명 요청
  - [ ] UI Elements 그룹화 지시

#### 3.2 기능 변환 로직
- [ ] UI Elements → Features 변환 함수
  - [ ] 관련 elements 그룹화
  - [ ] 기능명 자동 생성
  - [ ] 사용 시나리오 추론

#### 3.3 출력 형식 개선
- [ ] 기능별 섹션 템플릿
- [ ] 시나리오 기반 설명 템플릿
- [ ] 스크린샷 + 설명 통합

---

### Phase 4: 부분 업데이트 (4h)

#### 4.1 Update 명령어
- [ ] `src/cli/commands/update.ts`
  - [ ] CLI 옵션 정의 (`--page`, `--all-pages`)
  - [ ] 기존 문서 구조 파싱
  - [ ] 선택적 크롤링 실행

#### 4.2 페이지 업데이터
- [ ] `src/agent/subagents/page-updater.ts`
  - [ ] 특정 페이지 크롤링
  - [ ] 기존 문서 병합 로직
  - [ ] 메타데이터 업데이트

#### 4.3 CLI 통합
- [ ] `src/cli/index.ts`
  - [ ] `update` 명령어 등록
  - [ ] 옵션 파서 추가

---

### Phase 5: CLI 옵션 확장 (2h)

#### 5.1 Generate 명령어 옵션 추가
- [ ] `src/cli/commands/generate.ts`
  - [ ] `--template <name>` - 템플릿 선택
  - [ ] `--template-file <path>` - 커스텀 템플릿
  - [ ] `--multi-file` - 다중 파일 모드 (기본값)
  - [ ] `--single-file` - 레거시 단일 파일 모드

#### 5.2 설정 파일 지원
- [ ] `.quillrc.json` 지원
  - [ ] 템플릿 설정
  - [ ] 출력 구조 설정
  - [ ] 기본 옵션 설정

---

### Phase 6: 테스트 (3h)

#### 6.1 단위 테스트
- [ ] 템플릿 로더 테스트
- [ ] 다중 파일 생성 테스트
- [ ] 사이트맵 생성 테스트
- [ ] 기능 변환 로직 테스트

#### 6.2 통합 테스트
- [ ] 전체 워크플로우 테스트
  - [ ] 템플릿 선택 → 다중 파일 생성
  - [ ] 부분 업데이트 동작
- [ ] 다양한 템플릿 테스트

#### 6.3 E2E 테스트
- [ ] 실제 사이트 크롤링 테스트
- [ ] 생성된 문서 품질 확인

---

### Phase 7: 문서화 (2h)

#### 7.1 README 업데이트
- [ ] 템플릿 시스템 설명
- [ ] 다중 파일 구조 설명
- [ ] Update 명령어 사용법
- [ ] 빌트인 템플릿 가이드

#### 7.2 템플릿 가이드
- [ ] `docs/TEMPLATES.md` 작성
  - [ ] 템플릿 스키마 문서
  - [ ] 커스텀 템플릿 작성 가이드
  - [ ] 빌트인 템플릿 커스터마이징 예제

#### 7.3 CHANGELOG 업데이트
- [ ] v1.1.0 항목 추가
  - [ ] 템플릿 시스템 추가
  - [ ] 다중 파일 생성 지원
  - [ ] Update 명령어 추가
  - [ ] 사용자 친화적 콘텐츠 개선

---

## 📦 의존성 추가

```json
{
  "dependencies": {
    "js-yaml": "^4.1.0",  // YAML 파싱
    "handlebars": "^4.7.8"  // 템플릿 엔진
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/handlebars": "^4.1.0"
  }
}
```

---

## ⏱️ 예상 소요 시간

| Phase | 작업 내용 | 예상 시간 |
|-------|----------|----------|
| 1 | 템플릿 시스템 | 4h |
| 2 | 다중 파일 생성 | 6h |
| 3 | 콘텐츠 개선 | 4h |
| 4 | 부분 업데이트 | 4h |
| 5 | CLI 옵션 확장 | 2h |
| 6 | 테스트 | 3h |
| 7 | 문서화 | 2h |
| **총계** | | **25h** |

---

## 🎯 우선순위

### High Priority (Phase 1-2)
- 템플릿 시스템 기반 구축
- 다중 파일 생성 핵심 로직

### Medium Priority (Phase 3-5)
- 콘텐츠 품질 개선
- 부분 업데이트 기능
- CLI 옵션 확장

### Low Priority (Phase 6-7)
- 테스트 커버리지
- 문서화

---

## ⚠️ 주의사항

1. **하위 호환성**: 기존 단일 파일 모드 유지 (`--single-file`)
2. **점진적 마이그레이션**: 사용자가 선택할 수 있도록
3. **템플릿 검증**: 잘못된 템플릿으로 인한 오류 방지
4. **파일 시스템 권한**: 디렉토리 생성 권한 확인
5. **기존 문서 보존**: Update 시 수동 수정 내용 보존

---

## 🔄 다음 단계

1. ✅ Issue #14 생성 완료
2. ✅ 작업 계획 수립 완료
3. ⏭️ 브랜치 생성: `feature/14-template-multi-file-docs`
4. ⏭️ Phase 1부터 순차적으로 구현 시작

---

**Generated**: 2025-10-26
**Issue**: #14
**Target Version**: v1.1.0
**Estimated Completion**: 25 hours
