-- surface_config 쓰기 보안 강화 (1/2) — 관리자 토큰 검증 보안 함수 생성.
-- 기존(006): anon 키로 누구나 INSERT/UPDATE 가능 → 임의 소스를 공개 홈('추가 데이터')에 강제 노출/조작 가능(취약점).
-- 변경: 관리자 세션 토큰(admin_sessions)을 서버측에서 검증하는 SECURITY DEFINER 함수로만 쓰도록 강제.
--       (익명 직접쓰기 정책 제거는 009 에서 — 신 프론트 배포·캐시 만료 후 실행하면 무중단)
--
-- 프론트는 supabase-js .rpc('admin_set_surface_config', {...}) 로 호출하며 토큰은 운영 콘솔 로그인 시
-- localStorage(jbax-admin-token)에 저장된 값을 전달한다.
--   · 인증 실패(토큰 무효/만료) → 함수가 FALSE 반환 → 클라이언트가 재로그인 유도.
--   · 입력 거부(source_id 누락·disposition 비허용·note 과대/비JSON) → RAISE EXCEPTION → 클라이언트는
--     error 분기로 처리(로그아웃 없이 실패). 두 실패를 구분해 멀쩡한 세션을 끊지 않는다.

CREATE OR REPLACE FUNCTION admin_set_surface_config(
  p_token        TEXT,
  p_source_id    TEXT,
  p_disposition  TEXT DEFAULT NULL,
  p_target_table TEXT DEFAULT NULL,
  p_note         TEXT DEFAULT NULL,
  p_set_note     BOOLEAN DEFAULT FALSE   -- true = 차트설정(note)만 갱신, false = 트리아지(disposition) 갱신
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
SET statement_timeout = 3000            -- 단일 호출 3초 상한(어뷰즈 시 장기 점유 방지)
AS $$
DECLARE
  v_ip TEXT;
BEGIN
  -- ── 인증 (실패 = FALSE, 클라이언트가 재로그인 유도) ──
  -- 토큰 형식: 32바이트 hex = 64자. 무효 형식은 DB 조회 전에 차단.
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN FALSE;
  END IF;
  -- 미만료 세션 매칭(없으면 인증 실패).
  SELECT ip INTO v_ip FROM admin_sessions WHERE token = p_token AND expires_at > now();
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- ── 입력 검증 (실패 = EXCEPTION, 클라이언트 error 분기 → 로그아웃 없이 실패) ──
  IF p_source_id IS NULL OR length(btrim(p_source_id)) = 0 THEN
    RAISE EXCEPTION 'invalid_input: source_id required';
  END IF;
  IF length(p_source_id) > 200 THEN
    RAISE EXCEPTION 'invalid_input: source_id too long';
  END IF;
  IF p_disposition IS NOT NULL
     AND p_disposition NOT IN ('shown','planned','archived','excluded') THEN
    RAISE EXCEPTION 'invalid_input: bad disposition';
  END IF;
  IF p_note IS NOT NULL THEN
    IF length(p_note) > 4096 THEN
      RAISE EXCEPTION 'invalid_input: note too long';
    END IF;
    BEGIN
      PERFORM p_note::jsonb;            -- 차트설정 note 는 JSON 만 허용(파싱 불가 시 거부)
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'invalid_input: note must be JSON';
    END;
  END IF;

  -- ── 쓰기 (postgres 소유 SECURITY DEFINER → RLS 우회) ──
  IF p_set_note THEN
    -- 차트 설정(note)만 저장: 행 없으면 생성, 있으면 note 만 갱신(disposition 보존)
    INSERT INTO surface_config (source_id, note, updated_at, updated_by)
    VALUES (p_source_id, p_note, now(), 'admin')
    ON CONFLICT (source_id) DO UPDATE
      SET note = EXCLUDED.note, updated_at = now(), updated_by = 'admin';
  ELSE
    -- 트리아지(disposition) 저장: target_table 은 전달(non-NULL) 시에만 갱신
    INSERT INTO surface_config (source_id, disposition, target_table, updated_at, updated_by)
    VALUES (p_source_id, p_disposition, p_target_table, now(), 'admin')
    ON CONFLICT (source_id) DO UPDATE
      SET disposition  = EXCLUDED.disposition,
          target_table = COALESCE(EXCLUDED.target_table, surface_config.target_table),
          updated_at   = now(), updated_by = 'admin';
  END IF;

  -- ── 감사 로그(admin_audit, anon 미열람) — 실패해도 쓰기엔 영향 없음 ──
  BEGIN
    INSERT INTO admin_audit (ip, action, detail)
    VALUES (
      v_ip,
      'surface_config_set',
      p_source_id || ':' || COALESCE(p_disposition, CASE WHEN p_set_note THEN 'note' ELSE 'reset' END)
    );
  EXCEPTION WHEN others THEN
    NULL;
  END;

  RETURN TRUE;
END;
$$;

-- 호출은 anon/authenticated 가능(내부에서 토큰 검증). PUBLIC 광범위 실행권한은 회수.
REVOKE ALL ON FUNCTION admin_set_surface_config(TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_set_surface_config(TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN) TO anon, authenticated;
