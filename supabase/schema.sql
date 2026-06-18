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

-- ── AI 인사이트 질의 이력 (002 마이그레이션과 동일) ──────────────────────────────
-- AI 인사이트 질의 이력 (브라우저 session_id 단위). 질의 대상은 공개 집계 통계라 개인식별정보 없음.
CREATE TABLE IF NOT EXISTS ai_insight_chat (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'data',          -- ai | data
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,      -- 관련 분석 페이지 딥링크
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_insight_chat_session
  ON ai_insight_chat (session_id, created_at DESC);

ALTER TABLE ai_insight_chat ENABLE ROW LEVEL SECURITY;

-- 공개 데모/내부 도구: anon 읽기·삽입·삭제 허용(질의는 공개 통계 대상, 개인정보 없음).
-- 운영 강화 시 Supabase Auth + session 소유자 제한 정책으로 교체 권장.
CREATE POLICY "allow_read_ai_insight_chat"
  ON ai_insight_chat FOR SELECT USING (true);
CREATE POLICY "allow_insert_ai_insight_chat"
  ON ai_insight_chat FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_ai_insight_chat"
  ON ai_insight_chat FOR DELETE USING (true);

-- ── 분석용 웨어하우스: 제네릭 메트릭 스냅샷(이력 누적) — migration 003 참조 ──
-- 수집 배치마다 batch_date를 찍어 append → 지표 시계열·추세 보존(정적 realData.ts는 최신값만).
CREATE TABLE IF NOT EXISTS metric_snapshots (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  batch_date DATE NOT NULL,
  source TEXT NOT NULL,          -- 수집 소스 id
  dataset TEXT NOT NULL,         -- 논리 지표 그룹 (exchange_rate, employment_status ...)
  metric TEXT NOT NULL,          -- 지표명 (usd, count, transfer_income ...)
  dims JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 차원 (nationality, status, industry, band ...)
  period TEXT,                   -- 기간 라벨 (연/월/일)
  value DOUBLE PRECISION,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_dataset ON metric_snapshots (dataset, metric, batch_date);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_source ON metric_snapshots (source, batch_date);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_period ON metric_snapshots (dataset, period);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_dims ON metric_snapshots USING gin (dims);

-- 적재는 (batch_date, source) 단위 delete 후 insert(멱등) → 별도 유니크 제약 불필요.
-- RLS 기본 잠금(service_role 로더만). 분석 결과를 브라우저/AI에 노출하려면 아래 정책을 소유자가 추가.
ALTER TABLE metric_snapshots ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "read_metric_snapshots" ON metric_snapshots FOR SELECT USING (true);

CREATE OR REPLACE VIEW metric_latest AS
SELECT DISTINCT ON (dataset, metric, dims)
  dataset, metric, dims, period, value, unit, batch_date
FROM metric_snapshots
ORDER BY dataset, metric, dims, batch_date DESC;

-- ── 사용자 제안 접수 + 관리자 답변 (migration 004 참조) ──
CREATE TABLE IF NOT EXISTS feature_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'feature',       -- feature | data
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  page TEXT,
  status TEXT NOT NULL DEFAULT 'received',          -- received | reviewing | answered | rejected
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_session ON feature_requests (session_id, created_at DESC);
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
-- UPDATE(관리자 답변)는 anon 불가 — admin-respond Edge Function이 service_role로만 수정(위조 차단).
CREATE POLICY "fr_insert" ON feature_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "fr_select" ON feature_requests FOR SELECT USING (true);

-- ── 익명 접속 통계 (migration 004 참조) ──
CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer_host TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_insert" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "pv_select" ON page_views FOR SELECT USING (true);
