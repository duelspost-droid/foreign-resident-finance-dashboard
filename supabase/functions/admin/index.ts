// 운영 콘솔 관리자 Edge Function (Supabase / Deno) — 맛집 트래커 인증 방식 차용.
// 보안: PBKDF2 솔트 해시 비밀번호(admin_config) / 세션 토큰(admin_sessions, 비번 미저장) /
//       무차별 대입 잠금 / 관리자 감사 로그(admin_audit). 답변 쓰기는 토큰 검증 후 service_role로만.
//
// 배포(소유자 1회):
//   supabase functions deploy admin --no-verify-jwt
//   supabase secrets set ADMIN_PASSWORD=<최초 비밀번호>   # 첫 로그인 시 PBKDF2로 시드. 이후 콘솔에서 변경.
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 Supabase가 함수에 자동 주입)
//
// 액션: login / validate / logout / change_password / respond
// 주의: Deno 런타임 전용 — Next tsconfig 타입체크 제외.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// @ts-ignore Deno
const SB_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore Deno
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SH = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

const PBKDF2_ITER = 120000;
const SESSION_HOURS = 8;
const LOCK_WINDOW_MIN = 15;
const LOCK_MAX_FAILS = 5;
const ALLOWED_STATUS = ["received", "reviewing", "answered", "rejected"];

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "content-type": "application/json" } });
}

// ── 암호 유틸 ──────────────────────────────────────────────────
function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function sha256(s: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}
async function pbkdf2(password: string, salt: string, iter: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: iter, hash: "SHA-256" }, key, 256);
  return toHex(bits);
}
function randHex(bytes: number): string {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a);
  return Array.from(a).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ── 비밀번호(admin_config) ────────────────────────────────────
async function getConfig(): Promise<{ password_hash: string; salt: string | null; iterations: number | null }> {
  const r = await fetch(`${SB_URL}/rest/v1/admin_config?id=eq.1&select=password_hash,salt,iterations`, { headers: SH });
  const rows = r.ok ? await r.json() : [];
  return rows[0] || { password_hash: "", salt: null, iterations: null };
}
async function setPassword(newPw: string) {
  const salt = randHex(16);
  const hash = await pbkdf2(newPw, salt, PBKDF2_ITER);
  await fetch(`${SB_URL}/rest/v1/admin_config`, {
    method: "POST",
    headers: { ...SH, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id: 1, password_hash: hash, salt, iterations: PBKDF2_ITER, updated_at: new Date().toISOString() })
  });
}
async function ensureSeed() {
  const cfg = await getConfig();
  // @ts-ignore Deno
  if (!cfg.password_hash) await setPassword(Deno.env.get("ADMIN_PASSWORD") || "change-me");
}
async function verifyPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const cfg = await getConfig();
  if (!cfg.password_hash) return false;
  if (cfg.salt) {
    const h = await pbkdf2(password, cfg.salt, cfg.iterations || PBKDF2_ITER);
    return timingSafeEqual(h, cfg.password_hash);
  }
  const legacy = await sha256(password);
  if (timingSafeEqual(legacy, cfg.password_hash)) { await setPassword(password); return true; }
  return false;
}

// ── 세션 토큰(admin_sessions) ─────────────────────────────────
async function createSession(ip: string): Promise<{ token: string; expires_at: string }> {
  const token = randHex(32);
  const expires_at = new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString();
  await fetch(`${SB_URL}/rest/v1/admin_sessions`, { method: "POST", headers: SH, body: JSON.stringify({ token, ip, expires_at }) });
  return { token, expires_at };
}
async function validSession(token: string): Promise<boolean> {
  if (!token || token.length < 32) return false;
  const r = await fetch(`${SB_URL}/rest/v1/admin_sessions?token=eq.${encodeURIComponent(token)}&select=expires_at`, { headers: SH });
  const rows = r.ok ? await r.json() : [];
  if (!rows.length) return false;
  return new Date(rows[0].expires_at).getTime() > Date.now();
}
async function deleteSession(token: string) {
  if (token) await fetch(`${SB_URL}/rest/v1/admin_sessions?token=eq.${encodeURIComponent(token)}`, { method: "DELETE", headers: SH });
}
async function deleteAllSessions() {
  await fetch(`${SB_URL}/rest/v1/admin_sessions?token=neq.__none__`, { method: "DELETE", headers: SH });
}
async function purgeExpiredSessions() {
  await fetch(`${SB_URL}/rest/v1/admin_sessions?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`, { method: "DELETE", headers: SH }).catch(() => {});
}

// ── 감사 로그 / 잠금 ──────────────────────────────────────────
function getIP(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
async function logAudit(action: string, ip: string, detail = "", ua = "") {
  await fetch(`${SB_URL}/rest/v1/admin_audit`, {
    method: "POST", headers: SH,
    body: JSON.stringify({ ip, action, detail, user_agent: ua.slice(0, 300) })
  }).catch(() => {});
}
async function isLocked(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCK_WINDOW_MIN * 60 * 1000).toISOString();
  const url = `${SB_URL}/rest/v1/admin_audit?select=id&action=eq.admin_fail&ip=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(since)}`;
  const r = await fetch(url, { headers: { ...SH, Prefer: "count=exact", Range: "0-0" } });
  const tot = (r.headers.get("content-range") || "").split("/")[1];
  return !(!tot || tot === "*") && Number(tot) >= LOCK_MAX_FAILS;
}

// @ts-ignore Deno
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!SB_URL || !SERVICE_KEY) return json({ error: "server not configured" }, 500);

  const body = await req.json().catch(() => ({}));
  const action = (body.action || "").toString();
  const ip = getIP(req);
  const ua = req.headers.get("user-agent") || "";
  await ensureSeed();

  // 로그인: 비번 → 토큰
  if (action === "login") {
    if (await isLocked(ip)) return json({ error: "잠시 후 다시 시도하세요(로그인 시도 과다)" }, 429);
    if (!(await verifyPassword((body.password || "").toString()))) {
      await logAudit("admin_fail", ip, "login", ua);
      return json({ error: "비밀번호가 올바르지 않습니다" }, 401);
    }
    await logAudit("admin_login", ip, "", ua);
    await purgeExpiredSessions(); // 만료 세션 정리(테이블 증가 방지)
    const sess = await createSession(ip);
    return json({ ok: true, token: sess.token, expiresAt: sess.expires_at });
  }

  // 세션 검증(자동 재로그인)
  if (action === "validate") {
    return json({ ok: await validSession((body.token || "").toString()) });
  }

  // 로그아웃
  if (action === "logout") {
    await deleteSession((body.token || "").toString());
    await logAudit("admin_logout", ip, "", ua);
    return json({ ok: true });
  }

  // 비밀번호 변경
  if (action === "change_password") {
    if (await isLocked(ip)) return json({ error: "잠시 후 다시 시도하세요" }, 429);
    const cur = (body.currentPassword || "").toString();
    if (!(await verifyPassword(cur))) {
      await logAudit("admin_fail", ip, "pw_change", ua);
      return json({ error: "현재 비밀번호가 올바르지 않습니다" }, 401);
    }
    const np = (body.newPassword || "").toString();
    if (np.length < 8) return json({ error: "새 비밀번호는 8자 이상" }, 400);
    await setPassword(np);
    await deleteAllSessions();           // 모든 세션 무효화
    await logAudit("admin_pw_change", ip, "", ua);
    const sess = await createSession(ip); // 현재 기기 새 토큰
    return json({ ok: true, token: sess.token, expiresAt: sess.expires_at });
  }

  // 답변 쓰기(토큰 검증 후 service_role)
  if (action === "respond") {
    if (!(await validSession((body.token || "").toString()))) return json({ error: "unauthorized" }, 401);
    const id = Number(body.id);
    const status = String(body.status ?? "");
    if (!Number.isFinite(id) || id <= 0) return json({ error: "id required" }, 400);
    if (!ALLOWED_STATUS.includes(status)) return json({ error: "invalid status" }, 400);
    const adminResponse = typeof body.adminResponse === "string" ? body.adminResponse : null;
    const res = await fetch(`${SB_URL}/rest/v1/feature_requests?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...SH, Prefer: "return=minimal" },
      body: JSON.stringify({ status, admin_response: adminResponse, responded_at: new Date().toISOString() })
    });
    if (!res.ok) return json({ error: `update failed ${res.status}`, detail: (await res.text()).slice(0, 300) }, 502);
    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
});
