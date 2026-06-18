-- 사용자 제안 접수(기능/데이터 요청) + 관리자 답변, 익명 접속 통계.
-- 경량 모델(로그인 없음): 익명 세션(localStorage) 단위. 개인식별정보 미수집.

-- ── 제안 접수 + 답변 ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id TEXT NOT NULL,                     -- 익명 제출자 세션
  category TEXT NOT NULL DEFAULT 'feature',      -- feature | data
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  page TEXT,                                     -- 제출 화면 경로
  status TEXT NOT NULL DEFAULT 'received',        -- received | reviewing | answered | rejected
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_session ON feature_requests (session_id, created_at DESC);

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
-- 익명 제출/조회는 anon 허용. UPDATE(관리자 답변)는 anon 불가 —
-- admin-respond Edge Function이 패스코드 검증 후 service_role로만 쓴다(위조 차단).
CREATE POLICY "fr_insert" ON feature_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "fr_select" ON feature_requests FOR SELECT USING (true);
-- (anon UPDATE 정책 없음 — service_role(Edge Function)만 수정 가능)

-- ── 익명 접속 통계(페이지뷰) ───────────────────────────────────────────────────────
-- IP·UA·전체 URL 미저장. 세션 id(랜덤)·경로·외부 유입 도메인(host)만.
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
