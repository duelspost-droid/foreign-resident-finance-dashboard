// 운영 콘솔 ↔ admin Edge Function 클라이언트. 비밀번호는 저장하지 않고 토큰만 보관.
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "./supabaseConfig";

const ADMIN_FN = `${SUPABASE_PUBLIC_URL}/functions/v1/admin`;

// status=0 → 전송 실패(오프라인/CORS/미배포). 그 외는 HTTP 상태.
async function call(payload: Record<string, unknown>): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  if (!SUPABASE_PUBLIC_URL || !SUPABASE_PUBLIC_ANON_KEY) return { ok: false, status: 0, data: { error: "Supabase 미연결" } };
  try {
    const res = await fetch(ADMIN_FN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLIC_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLIC_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "네트워크 오류" } };
  }
}

export async function adminLogin(password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  const { ok, data } = await call({ action: "login", password });
  return { ok, token: typeof data.token === "string" ? data.token : undefined, error: typeof data.error === "string" ? data.error : undefined };
}

export type ValidateState = "valid" | "invalid" | "unreachable";

// 토큰 검증. 전송 실패(unreachable) 시 토큰을 버리지 않도록 구분(오프라인/블립에 로그아웃 방지).
export async function adminValidate(token: string): Promise<ValidateState> {
  if (!token) return "invalid";
  const { ok, status, data } = await call({ action: "validate", token });
  if (status === 0) return "unreachable";
  if (ok && data.ok === true) return "valid";
  return "invalid";
}

export async function adminLogout(token: string): Promise<void> {
  if (token) await call({ action: "logout", token });
}

// 답변 쓰기. authExpired=true(401)면 세션 만료 → 호출부가 재로그인 유도.
export async function adminRespond(
  token: string,
  id: number,
  patch: { status: string; adminResponse?: string }
): Promise<{ ok: boolean; authExpired: boolean }> {
  const { ok, status } = await call({ action: "respond", token, id, status: patch.status, adminResponse: patch.adminResponse ?? null });
  return { ok, authExpired: status === 401 };
}

// 대시보드 재빌드 트리거(토큰 검증 후 GitHub workflow_dispatch). authExpired=true(401)면 재로그인.
export async function adminTriggerRebuild(
  token: string
): Promise<{ ok: boolean; authExpired: boolean; error?: string }> {
  const { ok, status, data } = await call({ action: "trigger_rebuild", token });
  return { ok, authExpired: status === 401, error: typeof data.error === "string" ? data.error : undefined };
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const { ok, data } = await call({ action: "change_password", currentPassword, newPassword });
  return { ok, token: typeof data.token === "string" ? data.token : undefined, error: typeof data.error === "string" ? data.error : undefined };
}
