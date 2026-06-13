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

1. `npm install` 실행 후 `npm run typecheck`, `npm run build` 검증
2. Recharts/Next 버전 호환 문제가 있으면 package 버전 조정
3. 실제 지도는 `public/data/korea_regions.geojson`에 행정구역 GeoJSON을 넣고 `components/charts/RegionMap.tsx`를 교체
4. Supabase 연결 시 `lib/data/supabaseClient.ts` 기반 조회 함수 추가
5. 공공 API 또는 XLSX 수집은 `scripts/`의 TODO 스텁에서 구현
6. GitHub 원격 저장소가 정해지면 README의 GitHub 명령 순서대로 push

## 검증 기준

- `npm run dev` 실행 가능
- TypeScript 오류 없음
- 주요 페이지 라우팅 정상
- 샘플 데이터 기반 차트 표시
- 필터 UI 존재
- 랭킹 테이블 존재
- 금융 기회 점수 계산 표시
- 추천 액션 문구 표시
- 데이터 소스 페이지 존재
- 컴플라이언스 페이지 존재
