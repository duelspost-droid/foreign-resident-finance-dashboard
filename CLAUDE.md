# Claude Code Handoff

## 프로젝트

- 이름: 국내거주 외국인 금융 인사이트 대시보드
- 경로: `/home/user/foreign-resident-finance-dashboard` (리모트 환경) / `C:\tmp\foreign-resident-finance-dashboard` (로컬)
- GitHub: `https://github.com/duelspost-droid/foreign-resident-finance-dashboard`
- 브랜치: `main` (개발 완료 후 통합됨)
- 스택: Next.js 16 App Router, TypeScript, Tailwind CSS, Recharts, Supabase (옵션)
- 목적: 개인 단위 정보가 아닌 집계 통계로 외국인 금융 시장 기회를 분석하는 B2B 대시보드

## 현재 구현 상태 (2026-06-15 기준)

### 완료된 항목
- Next.js App Router 기반 전체 라우트 구현
  - `/` · `/dashboard` · `/regions` · `/nationalities` · `/universities`
  - `/visa-segments` · `/opportunity-scores` · `/data-sources` · `/compliance`
- 좌측 사이드바 + 상단 헤더
- `components/charts/RegionMap.tsx`: SVG 버블맵 (선형 메르카토르 투영, 17개 시도 거품 크기=인구, 색상=점수)
- `public/data/korea_regions.geojson`: 17개 시도 중심점 GeoJSON (Point 형식)
- `lib/data/supabaseClient.ts`: `fetchRegionData`, `fetchForeignResidentStatus`, `fetchFinanceSegments`, `fetchUniversityData` (Supabase 없을 때 null 반환, graceful fallback)
- `lib/data/generated/realData.ts`: 법무부 CSV 3종 실제 데이터 포함 (빌드 시 자동 생성)
- `lib/data/generated/dataLineage.ts`: 데이터 수집 이력 자동 기록
- `scripts/fetch_public_data.mjs`: 공공 데이터 수집기 (file/openapi/kosis 타입 지원)
- `scripts/build_real_data.mjs`: CSV+JSON → TypeScript 변환기
- `scripts/data_sources.mjs`: 데이터 소스 카탈로그 (현재 8개 소스 등록)
- `.github/workflows/pages.yml`: GitHub Actions CI/CD (매일 18:30 UTC 자동 수집·빌드·배포)
- GitHub Secrets 등록 완료: `KOSIS_API_KEY`, `DATA_GO_KR_SERVICE_KEY`
- 데이터 소스 페이지: 수집 이력, 요청 URL, 발굴 후보 표시

### 데이터 파이프라인 현황

**성공 (매일 자동 수집)**
| 소스 | 행수 | 상태 |
|------|------|------|
| 법무부 체류외국인 국적·자격별 현황 (3045188) | 400행 | ✅ downloaded |
| 법무부 외국인체류데이터 (3069963) | 380행 | ✅ downloaded |
| 법무부 연도별 외국인 유학생 (15100038) | 42행 | ✅ downloaded |

**미해결 (API 조회 실패 중)**
| 소스 | 오류 | 시도 중인 수정 |
|------|------|----------------|
| KOSIS 행안부 시도별 외국인주민 (TX_11025_A000_A) | `필수요청변수값이 누락되었습니다.` | `itmId=ALL, objL1=ALL, objL2=ALL` 추가 (CI run #10 테스트 중) |
| 행안부 openapi (1741000/StatisticsForeignResident) | HTTP 500 | operation: `getForeignResidentInfo` 으로 변경 (CI run #10 테스트 중) |

**새로 추가된 (미검증)**
| 소스 | datasetId | 상태 |
|------|-----------|------|
| 고용노동부 외국인 고용 현황 | 15137198 | verified: false |
| 고용노동부 외국인 취업자 현황 | 15137115 | verified: false |
| 여성가족부 다문화가족 현황 | 15054868 | verified: false |
| 법무부 출입국 외국인 통계월보 | 3069975 | verified: false |

### API 키 현황
- **KOSIS_API_KEY**: GitHub Secret 등록 완료. **보안 경고**: 이전 CI 수집 카탈로그(`data/catalog/latest_fetch_catalog.json`)에 키가 평문으로 노출되었음(마스킹 버그로 인해). 키 재발급 권장.
- **DATA_GO_KR_SERVICE_KEY**: GitHub Secret 등록 완료.
- 마스킹 버그는 2026-06-15에 수정됨 (`encodeURIComponent(apiKey)` 치환 추가).

## 중요한 제약 (보안·개인정보)

- 개인 단위 외국인 데이터 결합 금지
- 외국인등록번호, 여권번호, 국내거소신고번호, 이름, 전화번호, 상세주소, 계좌번호 사용 금지
- 내부 금융 데이터는 지역·월·국적·세그먼트 단위 집계값만 허용
- 소수 셀은 마스킹 또는 상위 분류 병합 필요

## 다음 해야 할 일 (우선순위 순)

### 즉시 (API 연동 완성)
1. **KOSIS TX_11025_A000_A 확인**: CI run #10 결과 확인 후
   - 성공 시 → `verified: true`로 변경, `responseMapping` 필드명 실제 응답으로 확정
   - 실패 시 → KOSIS `metaData.do` API 호출해 테이블 분류코드 조회 후 재시도
     ```
     GET https://kosis.kr/openapi/metaData.do?method=classificationId&apiKey=...&orgId=110&tblId=TX_11025_A000_A&format=json
     ```
2. **행안부 openapi 확인**: CI run #10 결과 확인 후
   - 성공 시 → `verified: true`, 필드명 확정
   - 실패 시 → data.go.kr 발굴 결과의 다른 openapi 소스 시도 (15057877, 15108065)

### 단기
3. **API 키 재발급**: KOSIS와 data.go.kr 키 모두 재발급 후 GitHub Secrets 업데이트
4. **새 파일 소스 검증**: CI 결과에서 15137198·15137115·15054868·3069975 다운로드 확인
5. **Supabase 연동**: Supabase 프로젝트 생성 → `supabase/schema.sql` 적용 → 환경변수 설정 → 페이지에서 `fetchRegionData()` 등 호출 연결

### 중기
6. **대시보드 페이지에 실제 데이터 연결**: 현재 `lib/data/generated/realData.ts` 임포트는 되나 페이지 컴포넌트에서 mock 대신 실제 데이터 사용하도록 교체
7. **지역 페이지 제목 교체**: `/regions` 페이지에 "placeholder" 텍스트 남아있음
8. **FilterBar 상태 연결**: 필터 UI가 차트에 실제로 반영되지 않음

## 파일 구조 핵심

```
scripts/
  data_sources.mjs         ← 소스 카탈로그 (수정 시 이 파일만)
  fetch_public_data.mjs    ← 수집 실행기 (file/kosis/openapi 콜렉터)
  build_real_data.mjs      ← CSV+JSON → TypeScript 변환기

lib/data/
  generated/
    realData.ts            ← 자동 생성 (git commit됨, 편집 금지)
    dataLineage.ts         ← 자동 생성 (git commit됨)
  supabaseClient.ts        ← Supabase 조회 함수

components/charts/
  RegionMap.tsx            ← SVG 버블맵 ("use client" 필요)

public/data/
  korea_regions.geojson    ← 17개 시도 중심점

.github/workflows/
  pages.yml                ← CI/CD (매일 18:30 UTC)

data/catalog/              ← .gitignore 제외, 최신 카탈로그 커밋됨
  latest_fetch_catalog.json
```

## 검증 기준

```bash
npm install          # 성공
npm run typecheck    # 성공
npm run build        # 성공
npm run data:all     # 성공 (법무부 CSV 3종 다운로드)
npm run dev -- -p 3000  # 실행 후 http://localhost:3000 확인
```

## GitHub Actions 수동 실행

```bash
# GitHub UI: Actions → Deploy GitHub Pages → Run workflow
# 또는 gh cli: gh workflow run pages.yml
```

## KOSIS API 참고

- 엔드포인트: `https://kosis.kr/openapi/statisticsData.do`
- 필수 파라미터: `method=getList&orgId=110&tblId=TX_11025_A000_A&prdSe=Y&startPrdDe=2020&endPrdDe=2024&itmId=ALL&objL1=ALL&format=json&jsonVD=Y`
- 오류 확인: 응답 JSON에 `err` 또는 `errMsg` 필드 존재 시 실패
- 메타데이터 조회: `https://kosis.kr/openapi/metaData.do?method=classificationId&...`
