// 운영 콘솔 ↔ admin Edge Function 클라이언트. 비밀번호는 저장하지 않고 토큰만 보관.
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "./supabaseConfig";

const ADMIN_FN = `${SUPABASE_PUBLIC_URL}/functions/v1/admin`;

async function call(payload: Record<string, unknown>): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  if (!SUPABASE_PUBLIC_URL || !SUPABASE_PUBLIC_ANON_KEY) return { ok: false, data: { error: "Supabase 미연결" } };
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
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: "네트워크 오류" } };
  }
}

export async function adminLogin(password: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  const { ok, data } = await call({ action: "login", password });
  return { ok, token: typeof data.token === "string" ? data.token : undefined, error: typeof data.error === "string" ? data.error : undefined };
}

export async function adminValidate(token: string): Promise<boolean> {
  if (!token) return false;
  const { ok, data } = await call({ action: "validate", token });
  return ok && data.ok === true;
}

export async function adminLogout(token: string): Promise<void> {
  if (token) await call({ action: "logout", token });
}

export async function adminRespond(
  token: string,
  id: number,
  patch: { status: string; adminResponse?: string }
): Promise<boolean> {
  const { ok } = await call({ action: "respond", token, id, status: patch.status, adminResponse: patch.adminResponse ?? null });
  return ok;
}

export async function adminChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const { ok, data } = await call({ action: "change_password", currentPassword, newPassword });
  return { ok, token: typeof data.token === "string" ? data.token : undefined, error: typeof data.error === "string" ? data.error : undefined };
}
