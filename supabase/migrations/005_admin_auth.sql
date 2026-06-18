-- 운영 콘솔 인증 (맛집 트래커 방식): PBKDF2 솔트 해시 비밀번호 + 세션 토큰 + 감사로그/잠금.
-- 모두 service_role(admin Edge Function)만 접근 — anon 정책 없음(브라우저 노출 금지).

-- 비밀번호(단일 행 id=1). 평문 미저장, PBKDF2(salt, iterations) 해시만.
CREATE TABLE IF NOT EXISTS admin_config (
  id INT PRIMARY KEY DEFAULT 1,
  password_hash TEXT NOT NULL DEFAULT '',
  salt TEXT,
  iterations INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_config_single CHECK (id = 1)
);

-- 세션 토큰(비번 대신 저장). 만료 8시간.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  ip TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions (expires_at);

-- 관리자 감사 로그 + 무차별 대입 잠금 카운트.
CREATE TABLE IF NOT EXISTS admin_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip TEXT,
  action TEXT NOT NULL,          -- admin_login | admin_fail | admin_pw_change | admin_logout
  detail TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_lock ON admin_audit (action, ip, created_at DESC);

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit ENABLE ROW LEVEL SECURITY;
-- 정책 없음 → anon 접근 불가. service_role(Edge Function)만 RLS 우회해 접근.
