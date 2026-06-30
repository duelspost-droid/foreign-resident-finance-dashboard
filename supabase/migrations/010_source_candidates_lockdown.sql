-- 보안 강화 (1/2) — source_candidates 익명 쓰기 차단용 관리자 보안함수 +
--                    insight-ai Edge Function 레이트리밋(금전적 DoS 방어).
-- 배경(취약점, 감사 2026-06-23):
--   ① source_candidates 에 anon INSERT/UPDATE 정책(WITH CHECK true)이 열려 있어 누구나
--      임의 datasetId 후보를 주입하고 status=approved 로 승인할 수 있다 → 다음 배치의
--      loadApprovedCandidateSources 가 그 소스를 수집(임의 URL fetch = SSRF/오염).
--   ② insight-ai 는 `--no-verify-jwt` 무인증이라 누구나 호출 → Claude API 과금(금전적 DoS).
-- 조치: 008(surface_config)과 동일 패턴 — 관리자 토큰(admin_sessions) 검증 SECURITY DEFINER 함수로만
--       후보 상태를 바꾸게 하고(익명 직접쓰기 정책은 011 에서 제거), AI 호출은 IP 레이트리밋을 건다.
--   ※ CI 의 sync_candidates 는 SERVICE_ROLE_KEY 로 upsert(RLS 우회)하므로 정책 제거의 영향 없음.

-- ── 후보 승인/거부/되돌리기: 관리자 토큰 검증 후에만 source_candidates 갱신 ──
CREATE OR REPLACE FUNCTION admin_set_candidate_status(
  p_token        TEXT,
  p_id           BIGINT,
  p_status       TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_notes        TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET statement_timeout = 3000
AS $$
DECLARE
  v_ip TEXT;
BEGIN
  -- ── 인증 (실패 = FALSE, 클라이언트가 재로그인 유도) ──
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN FALSE;
  END IF;
  SELECT ip INTO v_ip FROM admin_sessions WHERE token = p_token AND expires_at > now();
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- ── 입력 검증 (실패 = EXCEPTION, 클라이언트 error 분기 → 로그아웃 없이 실패) ──
  IF p_id IS NULL THEN
    RAISE EXCEPTION 'invalid_input: id required';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid_input: bad status';
  END IF;
  IF p_target_table IS NOT NULL AND length(p_target_table) > 200 THEN
    RAISE EXCEPTION 'invalid_input: target_table too long';
  END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 2000 THEN
    RAISE EXCEPTION 'invalid_input: notes too long';
  END IF;

  -- ── 쓰기 (postgres 소유 SECURITY DEFINER → RLS 우회) ──
  -- pending 으로 되돌리면 결정 메타 비움. target_table·notes 는 전달 시에만 갱신.
  UPDATE source_candidates
     SET status       = p_status,
         decided_at   = CASE WHEN p_status = 'pending' THEN NULL ELSE now() END,
         decided_by   = CASE WHEN p_status = 'pending' THEN NULL ELSE 'admin' END,
         target_table = COALESCE(p_target_table, target_table),
         notes        = COALESCE(p_notes, notes)
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_input: candidate not found';
  END IF;

  -- ── 감사 로그(admin_audit, anon 미열람) — 실패해도 쓰기엔 영향 없음 ──
  BEGIN
    INSERT INTO admin_audit (ip, action, detail)
    VALUES (v_ip, 'candidate_set_status', p_id || ':' || p_status);
  EXCEPTION WHEN others THEN
    NULL;
  END;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION admin_set_candidate_status(TEXT, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_set_candidate_status(TEXT, BIGINT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ── insight-ai 레이트리밋: IP 단위 슬라이딩 윈도우 ──
-- 테이블은 RLS 켜고 정책 없음 → SECURITY DEFINER 함수로만 접근(anon 직접 조회/삽입 불가).
CREATE TABLE IF NOT EXISTS insight_ai_rate (
  ip         TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insight_ai_rate_ip_time ON insight_ai_rate (ip, created_at);
ALTER TABLE insight_ai_rate ENABLE ROW LEVEL SECURITY;

-- 허용 시 호출 1건 기록 후 TRUE, 한도 초과 시 FALSE. 기본 시간당 IP당 20회.
CREATE OR REPLACE FUNCTION insight_ai_rate_check(
  p_ip          TEXT,
  p_max         INT DEFAULT 20,
  p_window_secs INT DEFAULT 3600
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET statement_timeout = 2000
AS $$
DECLARE
  v_ip    TEXT := COALESCE(NULLIF(btrim(p_ip), ''), 'unknown');
  v_count INT;
BEGIN
  -- 이 IP 의 만료분 정리(테이블 비대화 방지) 후 윈도우 내 호출 수 집계.
  DELETE FROM insight_ai_rate
   WHERE ip = v_ip AND created_at < now() - make_interval(secs => p_window_secs);
  SELECT count(*) INTO v_count
    FROM insight_ai_rate
   WHERE ip = v_ip AND created_at > now() - make_interval(secs => p_window_secs);
  IF v_count >= p_max THEN
    RETURN FALSE;
  END IF;
  INSERT INTO insight_ai_rate (ip) VALUES (v_ip);
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION insight_ai_rate_check(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION insight_ai_rate_check(TEXT, INT, INT) TO anon, authenticated, service_role;
