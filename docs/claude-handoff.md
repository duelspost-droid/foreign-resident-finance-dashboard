# Claude Handoff

> ⚠️ **STALE(초기 MVP 기준).** 현재는 공공 API 실데이터(법무부·KOSIS·행안부·ECOS 등)를 매일 수집해 렌더링하며, 아래 "샘플 데이터" 서술은 더 이상 사실이 아닙니다. **현재 상태·다음 작업은 `docs/latest-handoff.md` + `docs/next-tasks.md`(2026-06-22)** 를 보세요.

## 빠른 요약

이 저장소는 국내거주 외국인 공개/집계 데이터를 금융 데이터 관점에서 분석하는 MVP 대시보드입니다. 현재는 실제 API 대신 TypeScript 샘플 데이터로 모든 페이지를 렌더링합니다.

## 파일별 역할

- `app/*/page.tsx`: 화면 라우트
- `components/layout`: 사이드바, 헤더, 공통 필터
- `components/charts`: Recharts 차트와 지도 placeholder
- `components/cards`: KPI, 인사이트, 추천 카드
- `components/tables/DataTable.tsx`: 공통 테이블
- `lib/data/mockData.ts`: MVP 샘플 데이터
- `lib/data/score.ts`: 금융 기회 점수 계산
- `lib/data/insights.ts`: 추천 문장과 세그먼트별 니즈
- `lib/data/dataSources.ts`: 데이터 출처 설명
- `supabase/schema.sql`: Supabase 테이블과 RLS 정책
- `supabase/seed.sql`: 샘플 seed
- `scripts/*`: 향후 ETL 작업 스텁

## 데이터 원칙

개인 단위 데이터는 금지입니다. 화면과 테이블 모두 집계 단위로 유지해야 합니다. 상세 주소, 전화번호, 계좌번호, 외국인등록번호 같은 개인 식별자는 추가하지 마세요.

## 추천 다음 작업

1. git 상태 확인 후 `tsconfig.tsbuildinfo` 추적 제거와 `.gitignore` 변경을 커밋 amend 또는 새 커밋으로 정리
2. 실제 지도 데이터 연결
3. Supabase 조회 함수 추가
4. 공공 데이터 수집 스크립트 구현
5. GitHub 원격 저장소에 push

## 검증 완료

- `npm install`: 성공
- `npm run typecheck`: 성공
- `npm run build`: 성공
- `npm run dev -- -p 3000`: 실행 성공
- 주요 라우트: HTTP 200 확인
- 인앱 브라우저: Windows 권한 오류로 연결 실패

## 배포 완료

- Sites URL: `https://foreign-resident-finance.workspace-276930.chatgpt-team.site`
- project_id: `appgprj_6a2e1124e3a8819196ead14256439e4f`
- version: 1
- deployment_id: `appgdep_6a2e11b6eac481918556b47c88d8b803`
- source commit: `b09ad63745962c38e486aaeb12c14bbcb71efffb`
- access_mode: `custom`
