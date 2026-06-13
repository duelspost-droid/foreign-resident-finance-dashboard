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
