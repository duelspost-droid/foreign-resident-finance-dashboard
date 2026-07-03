-- ============================================================================
--  mock_residents — 외국인 정보 관리(가상) 전용 Postgres 스키마
-- ----------------------------------------------------------------------------
--  ⚠️ 전부 '가상(합성)' 데이터다. 실제 개인정보가 아니다.
--  이 테이블은 이 대시보드의 '집계 전용 분석' 스키마(supabase/migrations/*)와
--  완전히 분리된 '가상 데이터 전용' 스토어다. 프로덕션 분석 Supabase에는
--  적재하지 않는다(개인 단위 미저장·집계 전용 원칙 유지, app/compliance 참조).
--
--  단일 출처(single source of truth): lib/data/mockResidents.ts
--  시드 SQL 생성: `npm run mock:sql` (scripts/build_mock_residents_sql.mjs)
--  적재: psql "$DATABASE_URL" -f db/mock_residents/schema.sql
--        psql "$DATABASE_URL" -f db/mock_residents/seed.sql
--
--  주민등록번호·외국인등록번호는 실제 유효번호가 아니라 '뒷자리 마스킹 합성
--  포맷'(YYMMDD-N●●●●●●)만 저장한다(재식별·오용 방지).
-- ============================================================================

CREATE TABLE IF NOT EXISTS mock_residents (
  id            INTEGER PRIMARY KEY,                        -- 1..N (생성기 index+1, UI와 동일)
  name          TEXT    NOT NULL,                           -- 이름(합성)
  gender        TEXT    NOT NULL CHECK (gender IN ('남', '여')),
  birth_date    DATE    NOT NULL,                           -- 생년월일
  rrn_masked    TEXT    NOT NULL,                           -- 주민등록번호(마스킹 합성) YYMMDD-N●●●●●●
  frn_masked    TEXT    NOT NULL,                           -- 외국인등록번호(마스킹 합성) YYMMDD-N●●●●●●
  nationality   TEXT    NOT NULL,                           -- 국적(합성)
  visa          TEXT    NOT NULL,                           -- 체류자격
  sido          TEXT    NOT NULL,                           -- 시/도
  sigungu       TEXT    NOT NULL,                           -- 시/군/구
  registered_at DATE    NOT NULL,                           -- 등록일
  created_at    TIMESTAMP DEFAULT NOW()                     -- 적재 시각
);

-- 조회 화면 필터(국적·지역·성별)용 인덱스
CREATE INDEX IF NOT EXISTS idx_mock_residents_nationality ON mock_residents (nationality);
CREATE INDEX IF NOT EXISTS idx_mock_residents_sido        ON mock_residents (sido);
CREATE INDEX IF NOT EXISTS idx_mock_residents_gender      ON mock_residents (gender);
CREATE INDEX IF NOT EXISTS idx_mock_residents_region      ON mock_residents (sido, sigungu);

-- 이름 부분일치(ILIKE '%q%') 검색 가속 — 트라이그램 인덱스.
-- pg_trgm 확장이 없는 서버라면 아래 2줄은 생략 가능(ILIKE는 여전히 동작, 속도만 느림).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_mock_residents_name_trgm
  ON mock_residents USING gin (name gin_trgm_ops);

-- 문서화용 주석(합성·마스킹 명시)
COMMENT ON TABLE  mock_residents            IS '가상(합성) 외국인 정보 — 실제 개인정보 아님. 집계 전용 분석 스키마와 분리된 전용 스토어.';
COMMENT ON COLUMN mock_residents.rrn_masked IS '주민등록번호(마스킹 합성) — 뒷자리 마스킹, 실제 유효번호 아님';
COMMENT ON COLUMN mock_residents.frn_masked IS '외국인등록번호(마스킹 합성) — 뒷자리 마스킹, 실제 유효번호 아님';
