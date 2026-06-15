# Claude Code Handoff

## 프로젝트

- 이름: 국내거주 외국인 금융 인사이트 대시보드
- 경로: `/home/user/foreign-resident-finance-dashboard` (리모트 환경) / `C:\tmp\foreign-resident-finance-dashboard` (로컬)
- GitHub: `https://github.com/duelspost-droid/foreign-resident-finance-dashboard`
- 브랜치: `main` (개발 완료 후 통합됨)
- 스택: Next.js 16 App Router, TypeScript, Tailwind CSS, Recharts, Supabase (옵션)
- 목적: 개인 단위 정보가 아닌 집계 통계로 외국인 금융 시장 기회를 분석하는 B2B 대시보드

## 작업 이력 (세션별, 최신순)

### 2026-06-15 세션 (이어서) — 출처 조사 + 수집기 메뉴 분리
사용자 지시: "어디서 더 많은 정보를 가져와야할지 면밀하게 찾아봐" / "수집기가 정보 가져오는건 별도 메뉴로 분리해서 관리".

완료:
1. **신규 데이터 출처 조사** → `docs/data-sources-research.md` 작성
   - ★최우선: 한국은행 ECOS OpenAPI(국제수지·개인송금, 키 별도 발급 필요), 금융위 금융공공데이터(국내은행 통계, 기존 키)
   - KOSIS 실패 원인 규명: `statisticsData.do`+`ALL` 대신 `getMeta`로 itmId/objL 코드 조회 후 `statisticsParameterData.do` 2단계 호출 필요. 신규 테이블 DT_110025_A033_A(국적별 등록외국인) 발견
   - data.go.kr 발굴 후보 file/openapi 수십 개 목록화(미등록)
2. **발굴 키워드 확장** (`scripts/data_sources.mjs` discoveryQueries): 한국은행 송금/금융위 은행통계/외국인 환전 3종 추가
3. **수집기 메뉴 분리**: `/data-sources`에서 파이프라인 관리 부분을 신규 `/data-pipeline`(수집 파이프라인)로 이동
   - `app/data-pipeline/page.tsx`: 배치 실행 상태 바, 수집 요약 카드, lineage 테이블, 출처별 상세(요청 URL/오류), 발굴 후보
   - `app/data-sources/page.tsx`: 출처 정의·한계 큐레이션만 유지 + 파이프라인 바로가기 카드
   - `components/layout/Sidebar.tsx`: "수집 파이프라인"(DatabaseZap) 메뉴 추가
   - typecheck/build 통과, `/data-pipeline` 라우트 정상 등록

다음 작업 후보: docs/data-sources-research.md "다음 작업 권장 순서" 참고 (file 후보 일괄 등록 → KOSIS 2단계 호출 → ECOS collector 신규).

### 2026-06-15 세션 (claude-sonnet, session_012cb25b)
사용자 지시: "외국인 정보 모든정보를 api 등을 통해서라도 전부 가져오자" /
"홈페이지 디자인이 난해하다 … 분석가 관점에서 쉽게 확인할수 있도록 도표나 통계를 넣어 디자인 확 변경" /
"작업기록 모두 저장해서 다른 PC에서 이어서 작업 가능하게".

완료한 것:
1. **홈페이지 전면 재디자인** (`app/page.tsx`) — 커밋 `4acb9c5`
   - 다크 KPI 스트립(총 체류외국인/등록외국인/유학생/평균 기회점수, YoY 표기)
   - 3열 그리드: ① 지역별 기회점수 순위(점수 바) ② 국적 분포(가로 막대 + Recharts 막대) + 체류자격 세그먼트(범례 + 도넛) ③ 월별 추세선 + 자동 인사이트
   - 하단 기회점수 상세 테이블(`RankingTable`)
   - 인라인 컴포넌트 `ScorePill`, `ScoreBar`, `SectionHeader` (page.tsx 내부 정의)
   - 미연결 `FilterBar` 홈에서 제거
   - `app/dashboard/page.tsx` 는 `export { default } from "../page"` 라서 같이 변경됨
2. **KOSIS 키 마스킹 버그 수정** (`scripts/fetch_public_data.mjs` 276행) — `encodeURIComponent(apiKey)` 치환 추가. 이전엔 base64 키가 카탈로그에 평문 노출됨.
3. **신규 파일 소스 4종 추가** (`scripts/data_sources.mjs`) — 고용노동부 15137198·15137115, 여성가족부 15054868, 법무부 월보 3069975 (모두 verified:false).
4. **CI run #10 결과 분석**: 일시적 네트워크 장애로 전 소스 "fetch failed"(법무부 CSV 포함) → cached raw 사용. 단, 행안부 openapi `getForeignResidentInfo` 는 HTTP 200(0행) 반환 — 이전 `getStatisticsForeignResidentInfo` HTTP 500 대비 진전. KOSIS 는 network fail 로 파라미터 검증 불가.
5. 커밋 `4acb9c5` 푸시 완료 → CI run #11 트리거됨(결과 미확인).

다음 세션에서 **가장 먼저 할 것**: CI run #11(또는 최신) 의 `data/catalog/latest_fetch_catalog.json` 확인 →
- KOSIS `itmId/objL` 파라미터로 `필수요청변수값 누락` 해결됐는지
- 행안부 openapi 가 행 반환하는지(여전히 0행이면 발굴 후보 openapi 15057877/15108065 시도)
- 신규 파일 소스 4종 다운로드 성공 여부

확인 명령:
```bash
git pull origin main
git show HEAD:data/catalog/latest_fetch_catalog.json | python3 -c "
import json,sys
cat=json.load(sys.stdin)
for s in cat['sources']:
    r=s.get('result',{}); st=r.get('status','?')
    print(('✅' if st in('downloaded','cached') else '❌'), st, s['provider'], s['title'], r.get('rowCount',''), r.get('reason',''))
"
```

## 현재 구현 상태 (2026-06-15 기준)

### 완료된 항목
- Next.js App Router 기반 전체 라우트 구현
  - `/` · `/dashboard` · `/regions` · `/nationalities` · `/universities`
  - `/visa-segments` · `/opportunity-scores` · `/data-sources` · `/compliance`
- 좌측 사이드바 + 상단 헤더
- `app/page.tsx`: 분석가용 홈 대시보드 (다크 KPI 스트립 + 3열 도표 그리드 + 상세 테이블) — 2026-06-15 재디자인
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

> 참고: 법무부 CSV 3종은 정상 동작하나 CI run #10 에서는 일시적 네트워크 장애로
> 전 소스 fetch failed → cached raw 로 폴백됨. run #11 이상에서 재확인 필요.

**미해결 (API 조회 실패 중)**
| 소스 | 최근 오류 | 시도 중인 수정 |
|------|------|----------------|
| KOSIS 행안부 시도별 외국인주민 (TX_11025_A000_A) | `필수요청변수값이 누락` → run #10 은 network fail 로 미검증 | `itmId=ALL, objL1=ALL, objL2=ALL` 추가됨 (run #11 에서 검증) |
| 행안부 openapi (1741000/StatisticsForeignResident) | HTTP 200·0행 (run #10) — 이전 HTTP 500 보다 진전 | operation `getForeignResidentInfo`. 0행 지속 시 발굴 후보 15057877/15108065 시도 |

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
