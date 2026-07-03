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

## 대시보드를 이 DB와 연동(코드는 이미 배선됨 — env만 설정하면 켜짐)

`/mock-residents` 화면은 **`NEXT_PUBLIC_MOCK_SUPABASE_URL`/`NEXT_PUBLIC_MOCK_SUPABASE_ANON_KEY`가
설정돼 있으면 자동으로 DB 모드**(서버 페이지네이션 조회)로, 없으면 클라이언트 생성 모드로 동작합니다
(`lib/data/mockResidentsDb.ts` + `app/mock-residents/page.tsx`). 즉 아래 인프라만 소유자가 준비하면 됩니다.

정적 export(GitHub Pages)라 런타임 DB 접근은 **클라이언트 `supabase-js` + anon 키**만 가능 →
**반드시 별도 Supabase 프로젝트**(프로덕션 분석과 분리)를 씁니다.

1. **별도** Supabase 프로젝트 생성(프로덕션 분석 프로젝트와 분리).
2. 그 프로젝트에 `schema.sql` → `schema.supabase.sql`(anon 읽기 RLS) → 데이터 적재:
   - psql: `psql "$MOCK_DATABASE_URL" -f db/mock_residents/seed.sql` (권장, 10만 행 빠름)
   - 또는 REST: `MOCK_SUPABASE_URL=… MOCK_SUPABASE_SERVICE_ROLE_KEY=sb_secret_… npm run mock:load`
     (`--dry-run`으로 먼저 확인 가능. service_role 키는 CLI 전용, 커밋/프론트 금지.)
3. GitHub Actions 시크릿 + `.github/workflows/pages.yml` build 잡 env에 아래 2줄 추가(빌드시 프론트에 주입):
   ```yaml
   NEXT_PUBLIC_MOCK_SUPABASE_URL: ${{ secrets.MOCK_SUPABASE_URL }}
   NEXT_PUBLIC_MOCK_SUPABASE_ANON_KEY: ${{ secrets.MOCK_SUPABASE_ANON_KEY }}
   ```
4. 배포되면 화면 상단 배지가 **"DB 연동"**으로 바뀌고, 필터/페이지 변경마다 전용 DB를 서버 페이지네이션으로 조회합니다.

> env 미설정 시엔 지금처럼 **"로컬 생성"** 배지로 브라우저에서 10만 건을 만들어 보여줍니다(배포 무영향).
