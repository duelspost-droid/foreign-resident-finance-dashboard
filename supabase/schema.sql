CREATE TABLE IF NOT EXISTS foreign_resident_region_month (
  id BIGSERIAL PRIMARY KEY,
  base_month DATE NOT NULL,
  sido TEXT NOT NULL,
  sigungu TEXT NOT NULL,
  nationality TEXT NOT NULL,
  gender TEXT,
  resident_count INTEGER,
  short_term_count INTEGER,
  long_term_count INTEGER,
  yoy_change_rate NUMERIC,
  mom_change_rate NUMERIC,
  source_name TEXT,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_region_month_region
  ON foreign_resident_region_month (base_month, sido, sigungu);

CREATE INDEX IF NOT EXISTS idx_region_month_nationality
  ON foreign_resident_region_month (nationality);

CREATE TABLE IF NOT EXISTS foreign_resident_status (
  id BIGSERIAL PRIMARY KEY,
  base_month DATE,
  base_year INTEGER,
  nationality TEXT NOT NULL,
  visa_code TEXT,
  visa_name TEXT,
  segment_type TEXT,
  resident_count INTEGER,
  financial_need_tags TEXT[],
  source_name TEXT,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_nationality_segment
  ON foreign_resident_status (nationality, segment_type);

CREATE TABLE IF NOT EXISTS foreign_student_university (
  id BIGSERIAL PRIMARY KEY,
  base_year INTEGER NOT NULL,
  university_name TEXT NOT NULL,
  campus_name TEXT,
  university_type TEXT,
  sido TEXT,
  sigungu TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  nationality TEXT,
  degree_course TEXT,
  student_count INTEGER,
  source_name TEXT,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_university_region
  ON foreign_student_university (base_year, sido, sigungu);

CREATE INDEX IF NOT EXISTS idx_university_name
  ON foreign_student_university (university_name);

CREATE TABLE IF NOT EXISTS finance_segment_aggregate (
  id BIGSERIAL PRIMARY KEY,
  base_month DATE NOT NULL,
  sido TEXT,
  sigungu TEXT,
  dong TEXT,
  university_name TEXT,
  nationality TEXT,
  segment_type TEXT,
  account_open_count INTEGER,
  debit_card_issue_count INTEGER,
  remittance_count INTEGER,
  remittance_amount NUMERIC,
  fx_exchange_count INTEGER,
  payroll_account_count INTEGER,
  mobile_foreign_language_user_count INTEGER,
  average_balance NUMERIC,
  delinquency_rate NUMERIC,
  source_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_segment_region
  ON finance_segment_aggregate (base_month, sido, sigungu, nationality, segment_type);

CREATE TABLE IF NOT EXISTS region_finance_score (
  id BIGSERIAL PRIMARY KEY,
  base_month DATE NOT NULL,
  sido TEXT NOT NULL,
  sigungu TEXT NOT NULL,
  nationality TEXT,
  segment_type TEXT,
  foreign_population_score NUMERIC,
  remittance_need_score NUMERIC,
  student_finance_score NUMERIC,
  payroll_need_score NUMERIC,
  multilingual_cs_score NUMERIC,
  overall_opportunity_score NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_region_score_rank
  ON region_finance_score (base_month, overall_opportunity_score DESC);

ALTER TABLE foreign_resident_region_month ENABLE ROW LEVEL SECURITY;
ALTER TABLE foreign_resident_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE foreign_student_university ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_segment_aggregate ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_finance_score ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_region_month"
  ON foreign_resident_region_month FOR SELECT
  USING (true);

CREATE POLICY "allow_read_status"
  ON foreign_resident_status FOR SELECT
  USING (true);

CREATE POLICY "allow_read_university"
  ON foreign_student_university FOR SELECT
  USING (true);

CREATE POLICY "allow_read_finance_aggregate"
  ON finance_segment_aggregate FOR SELECT
  USING (true);

CREATE POLICY "allow_read_region_score"
  ON region_finance_score FOR SELECT
  USING (true);

-- ── 데이터 출처 후보 승인 큐 (관리자 승인 워크플로) ────────────────────────────
-- 매일 배치가 자동 발굴한 신규 데이터셋 후보를 적재하고, 관리자가 승인/거부한다.
-- 승인(approved)된 후보는 다음 수집 배치에서 자동 등록·수집된다.
CREATE TABLE IF NOT EXISTS source_candidates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- fileData | openapi | kosis | ecos
  provider TEXT,
  title TEXT,
  keyword TEXT,                       -- 발굴 키워드
  url TEXT,
  target_table TEXT,                  -- 수집 시 매핑할 테이블(승인 시 관리자 지정)
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  priority TEXT DEFAULT 'mid',        -- high | mid | low
  rationale TEXT,                     -- 활용 근거(조사 노트)
  discovered_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by TEXT,
  notes TEXT,
  UNIQUE (dataset_id, kind)
);

ALTER TABLE source_candidates ENABLE ROW LEVEL SECURITY;

-- 읽기는 공개. 쓰기(승인/거부)는 내부 관리도구 용도로 허용.
-- 운영에서는 Supabase Auth 로 관리자 역할 제한을 권장한다(아래 정책을 교체).
CREATE POLICY "allow_read_source_candidates"
  ON source_candidates FOR SELECT USING (true);
CREATE POLICY "allow_write_source_candidates"
  ON source_candidates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_insert_source_candidates"
  ON source_candidates FOR INSERT WITH CHECK (true);
