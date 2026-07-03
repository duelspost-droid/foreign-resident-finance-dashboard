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

## (선택) 대시보드를 이 DB와 연동하려면

정적 export 사이트(GitHub Pages)에는 서버가 없어, 런타임 DB 접근은 **클라이언트 `supabase-js` +
anon 키**만 가능합니다. 따라서 대시보드에서 이 데이터를 **실제 DB에서 읽게** 하려면:

1. **별도** Supabase 프로젝트를 하나 만든다(프로덕션 분석 프로젝트와 분리).
2. 그 프로젝트에 `schema.sql` → `schema.supabase.sql`(RLS) → `seed.sql` 순으로 적재한다.
3. `app/mock-residents/page.tsx`가 `generateMockResidents()` 대신 그 프로젝트의 anon 키로
   `.from('mock_residents').select('*', { count: 'exact' }).range(offset, offset+49)`(서버 페이지네이션)를
   호출하도록 연동한다.

> 이 연동은 **오너가 별도 프로젝트/시크릿을 준비**해야 하는 단계라 현재는 문서로만 남깁니다.
> 준비되면 페이지 연동 코드는 바로 붙일 수 있습니다.
