# 외국인 정보 관리(가상) — Postgres 스토어

> ⚠️ **전부 가상(합성) 데이터입니다. 실제 개인정보가 아닙니다.**
> 이 스토어는 이 대시보드의 **집계 전용 분석 스키마**(`supabase/migrations/*`)와 **완전히 분리된
> 가상 데이터 전용** Postgres입니다. **프로덕션 분석 Supabase에는 적재하지 않습니다**
> (개인 단위 미저장·집계 전용 원칙 유지 — `/compliance` 참조).

`app/mock-residents` 화면이 클라이언트에서 생성하는 10만 건의 합성 데이터를, 동일한 값 그대로
독립 Postgres DB에 저장해 **SQL로 조회·관리**할 수 있게 합니다.

## 구성

| 파일 | 용도 |
|---|---|
| `schema.sql` | 이식성 있는 순수 Postgres DDL(테이블·인덱스·주석). psql/모든 Postgres에서 동작 |
| `schema.supabase.sql` | (선택) **별도** Supabase 프로젝트에 적재해 대시보드 anon 읽기까지 연동할 때의 RLS |
| `seed.sql` | 10만 건 COPY 시드 — **커밋 제외(gitignore)**, `npm run mock:sql`로 재생성 |
| `scripts/build_mock_residents_sql.mjs` | 시드 생성기. `lib/data/mockResidents.ts`를 그대로 import(단일 출처) → **DB 행 == UI 표시값** |

## 적재(로컬/일반 Postgres)

```bash
# 0) 시드 생성 (기본 10만 건 → db/mock_residents/seed.sql)
npm run mock:sql                 # 또는: node scripts/build_mock_residents_sql.mjs --count 5000

# 1) 빈 DB 준비 (예: Docker)
#    docker run -d --name mockpg -e POSTGRES_PASSWORD=pw -p 5432:5432 postgres:16
export DATABASE_URL="postgresql://postgres:pw@localhost:5432/postgres"

# 2) 스키마 + 시드 적재
psql "$DATABASE_URL" -f db/mock_residents/schema.sql
psql "$DATABASE_URL" -f db/mock_residents/seed.sql
```

`seed.sql`은 `BEGIN; TRUNCATE mock_residents; COPY … ; COMMIT;` 구조라 **재실행해도 멱등**입니다
(항상 최신 10만 건으로 교체).

## 조회·관리 예시 (조회 화면과 동일한 조건)

```sql
-- 전체 건수
SELECT count(*) FROM mock_residents;                       -- 100000

-- 이름 부분검색 (UI의 '이름 검색' = ILIKE '%q%')
SELECT id, name, nationality, sido, sigungu
FROM mock_residents
WHERE name ILIKE '%nguyen%'
ORDER BY id
LIMIT 50;

-- 국적·성별·지역 필터 (UI 필터)
SELECT * FROM mock_residents
WHERE nationality = '베트남' AND gender = '여' AND sido = '경기도'
ORDER BY id
LIMIT 50 OFFSET 0;                                         -- 페이지네이션(50/페이지)

-- 국적별 분포
SELECT nationality, count(*) AS n
FROM mock_residents
GROUP BY nationality
ORDER BY n DESC;
```

## 대시보드 연동 (현재: 라이브 · 기존 프로젝트의 mock_residents 테이블)

`/mock-residents` 화면은 마운트 시 `mock_residents` 테이블을 **프로브**한다
(`lib/data/mockResidentsDb.ts` + `app/mock-residents/page.tsx`):
- 데이터가 있으면 → **DB 모드**(서버 페이지네이션 조회, 상단 "DB 연동" 배지).
- 없거나(테이블 부재) 오류면 → **클라이언트 생성 모드**(브라우저에서 10만 건 생성, "로컬 생성" 배지).

즉 **테이블 준비 여부와 무관하게 항상 동작**하고, 테이블에 데이터가 들어오면 코드 배포 없이 자동으로 DB 모드로 전환된다.

### 현재 구성(2026-07-03, 크롬으로 셋업 완료)
**비용 0** 경로 — 기존 대시보드 Supabase 프로젝트(`nrdapzgtibbusvoaceuh`)에 `mock_residents`
테이블만 추가했다(별도 테이블 + 읽기전용 RLS + 전부 합성 데이터라 실제 집계 데이터와 격리).
데이터는 서버측 `generate_series`로 10만 행 생성. 프론트는 기존 프로젝트의 공개 anon 키를
그대로 쓰므로 **시크릿/pages.yml 변경이 필요 없다**.

- 대상 DB 오버라이드가 필요하면 `NEXT_PUBLIC_MOCK_SUPABASE_URL/_ANON_KEY`로 별도 프로젝트를
  가리킬 수 있다(설정 시 그 프로젝트를, 없으면 기존 대시보드 프로젝트를 사용).

### (선택) 완전 별도 프로젝트로 옮기려면
1. 별도 Supabase 프로젝트 생성 → `schema.sql` → `schema.supabase.sql`(anon 읽기 RLS).
2. 데이터: `psql "$MOCK_DATABASE_URL" -f db/mock_residents/seed.sql`(권장) 또는
   `MOCK_SUPABASE_URL=… MOCK_SUPABASE_SERVICE_ROLE_KEY=sb_secret_… npm run mock:load`
   (service_role 키는 CLI 전용, 커밋/프론트 금지).
3. GitHub Actions 시크릿 + `pages.yml` build env에 2줄:
   ```yaml
   NEXT_PUBLIC_MOCK_SUPABASE_URL: ${{ secrets.MOCK_SUPABASE_URL }}
   NEXT_PUBLIC_MOCK_SUPABASE_ANON_KEY: ${{ secrets.MOCK_SUPABASE_ANON_KEY }}
   ```
