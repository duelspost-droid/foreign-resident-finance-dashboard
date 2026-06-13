# 국내거주 외국인 금융 인사이트 대시보드

## 목적

국내거주 외국인의 국적, 체류지역, 체류자격, 대학/유학생 데이터를 집계 단위로 분석하여 금융 상품 기획, 마케팅, 지점 전략, 다국어 상담 리소스 배치에 활용하기 위한 대시보드입니다.

## 주의사항

본 프로젝트는 개인 단위 외국인 정보를 수집하거나 표시하지 않습니다. 모든 분석은 공공통계 또는 집계 데이터 기준으로 수행됩니다.

외국인등록번호, 여권번호, 국내거소신고번호, 이름, 전화번호, 상세주소, 계좌번호는 수집·저장·표시 대상이 아닙니다.

## 주요 기능

- 지역별 외국인 분포 분석
- 국적별 체류자격 분석
- 대학별 외국인 유학생 분석
- 금융 기회 점수 산출
- 추천 금융 액션 생성
- 데이터 소스와 컴플라이언스 설명

## 데이터 소스

- 법무부 등록외국인 체류현황
- 법무부 체류외국인 국적 및 체류자격별 현황
- 법무부 월별 체류외국인 통계
- 행정안전부 외국인주민 현황
- 교육부 외국인 유학생 현황
- 대학알리미 외국인유학생수
- 내부 금융 집계 데이터, 선택 사항

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 검증 명령

```bash
npm run typecheck
npm run build
```

## 주요 화면

- `/` 또는 `/dashboard`: 개요 대시보드
- `/regions`: 지역 분석
- `/nationalities`: 국적 분석
- `/universities`: 대학/유학생 분석
- `/visa-segments`: 체류자격 분석
- `/opportunity-scores`: 금융 기회 점수
- `/data-sources`: 데이터 소스
- `/compliance`: 개인정보/컴플라이언스

## 데이터 구조

샘플 데이터는 `lib/data/mockData.ts`에 있습니다. 공개 데이터 API 연동 전까지 모든 화면은 이 샘플 데이터로 렌더링됩니다.

Supabase용 SQL은 `supabase/schema.sql`, 샘플 seed는 `supabase/seed.sql`에 있습니다.

주요 테이블은 다음과 같습니다.

- `foreign_resident_region_month`
- `foreign_resident_status`
- `foreign_student_university`
- `finance_segment_aggregate`
- `region_finance_score`

## 스코어링

점수 계산 로직은 `lib/data/score.ts`에 있습니다. 입력값은 먼저 0~100으로 정규화한 뒤 다음 점수를 계산합니다.

- 외국인 인구 기회 점수
- 송금 수요 점수
- 유학생 금융 수요 점수
- 급여계좌 수요 점수
- 다국어 상담 필요도
- 전체 금융 기회 점수

추천 문구 생성 로직은 `lib/data/insights.ts`에 있습니다.

## Supabase 연동 계획

1. Supabase 프로젝트를 만든다.
2. SQL Editor에서 `supabase/schema.sql`을 실행한다.
3. 필요하면 `supabase/seed.sql`로 샘플 데이터를 적재한다.
4. `.env.example`을 참고해 `.env.local`에 Supabase URL과 anon key를 설정한다.
5. `lib/data/supabaseClient.ts`를 기준으로 실제 조회 함수를 추가한다.
6. `lib/data/mockData.ts` 의존 화면을 서버 조회 또는 API Route로 점진 교체한다.

## GitHub 연동 계획

```bash
git init
git add .
git commit -m "Initial foreign resident finance dashboard MVP"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
```

## 향후 개발

- 공공데이터 API 연동
- 교육부 XLSX 자동 파싱
- PostgreSQL/PostGIS 연동
- 내부 금융 집계 데이터 업로드 기능
- 지도 기반 행정구역 Choropleth 시각화
- 로그인/권한관리와 감사 로그
