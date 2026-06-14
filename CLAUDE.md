# Claude Code Handoff

## 프로젝트

- 이름: 국내거주 외국인 금융 인사이트 대시보드
- 경로: `C:\tmp\foreign-resident-finance-dashboard`
- 스택: Next.js, TypeScript, Tailwind CSS, Recharts, Supabase SQL 준비
- 목적: 개인 단위 정보가 아닌 집계 통계로 외국인 금융 시장 기회를 분석하는 B2B 대시보드

## 현재 구현 상태

- Next.js App Router 기반 프로젝트 구조 생성
- 좌측 사이드바와 상단 헤더 생성
- 주요 라우트 구현
  - `/`
  - `/dashboard`
  - `/regions`
  - `/nationalities`
  - `/universities`
  - `/visa-segments`
  - `/opportunity-scores`
  - `/data-sources`
  - `/compliance`
- 샘플 데이터: `lib/data/mockData.ts`
- 스코어 계산: `lib/data/score.ts`
- 추천 문구: `lib/data/insights.ts`
- 데이터 출처: `lib/data/dataSources.ts`
- Supabase 스키마: `supabase/schema.sql`
- Supabase 샘플 seed: `supabase/seed.sql`

## 중요한 제약

- 개인 단위 외국인 데이터 결합 금지
- 외국인등록번호, 여권번호, 국내거소신고번호, 이름, 전화번호, 상세주소, 계좌번호 사용 금지
- 내부 금융 데이터는 지역·월·국적·세그먼트 단위 집계값만 허용
- 소수 셀은 마스킹 또는 상위 분류 병합 필요

## 이어서 할 일

1. git 상태 확인 후 `tsconfig.tsbuildinfo` 추적 제거와 `.gitignore` 변경을 커밋 amend 또는 새 커밋으로 정리
2. 실제 지도는 `public/data/korea_regions.geojson`에 행정구역 GeoJSON을 넣고 `components/charts/RegionMap.tsx`를 교체
3. Supabase 연결 시 `lib/data/supabaseClient.ts` 기반 조회 함수 추가
4. 공공 API 또는 XLSX 수집은 `scripts/`의 TODO 스텁에서 구현
5. GitHub 원격 저장소가 정해지면 README의 GitHub 명령 순서대로 push

## 검증 기준

- `npm install`: 성공
- `npm audit --omit=dev`: 취약점 0개로 정리
- `npm run typecheck`: 성공
- `npm run build`: 성공
- `npm run dev -- -p 3000`: 실행 성공
- 주요 페이지 라우팅: HTTP 200 확인
- 인앱 브라우저 검증: Windows 권한 오류로 실패
- 샘플 데이터 기반 차트, 필터 UI, 랭킹 테이블, 점수 계산, 추천 액션, 데이터 소스, 컴플라이언스 페이지 구현 완료
