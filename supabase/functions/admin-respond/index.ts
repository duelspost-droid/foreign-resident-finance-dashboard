// 관리자 답변 쓰기 Edge Function (Supabase / Deno).
// 목적: feature_requests의 anon UPDATE를 제거하고, 관리자 답변/상태 변경을
//       이 함수에서만 service_role로 수행한다. 패스코드를 서버에서 검증하므로
//       브라우저 anon 키로는 답변을 위조할 수 없다.
//
// 배포(소유자 1회):
//   supabase functions deploy admin-respond --no-verify-jwt
//   supabase secrets set ADMIN_PASSCODE_HASH=<패스코드의 SHA-256 hex>
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 Supabase가 함수에 자동 주입)
//
// 주의: Deno 런타임 전용 — Next tsconfig 타입체크 제외 대상.

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const ALLOWED_STATUS = ["received", "reviewing", "answered", "rejected"];

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "content-type": "application/json" }
  });
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// @ts-ignore Deno global (Edge runtime)
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // @ts-ignore Deno global
  const url = Deno.env.get("SUPABASE_URL");
  // @ts-ignore Deno global
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  // @ts-ignore Deno global
  const passHash = Deno.env.get("ADMIN_PASSCODE_HASH");
  if (!url || !serviceRole) return json({ error: "server not configured" }, 500);
  // 패스코드 미설정 시 fail-closed (위조 방지가 목적이므로 무조건 검증 요구).
  if (!passHash) return json({ error: "ADMIN_PASSCODE_HASH 미설정" }, 500);

  let body: { id?: number; status?: string; adminResponse?: string; passcode?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  // 패스코드 서버 검증.
  const ok = body.passcode && (await sha256Hex(body.passcode)) === passHash;
  if (!ok) return json({ error: "unauthorized" }, 401);

  const id = Number(body.id);
  const status = String(body.status ?? "");
  if (!Number.isFinite(id) || id <= 0) return json({ error: "id required" }, 400);
  if (!ALLOWED_STATUS.includes(status)) return json({ error: "invalid status" }, 400);
  const adminResponse = typeof body.adminResponse === "string" ? body.adminResponse : null;

  const res = await fetch(`${url}/rest/v1/feature_requests?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      "content-type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      status,
      admin_response: adminResponse,
      responded_at: new Date().toISOString()
    })
  });
  if (!res.ok) {
    const t = await res.text();
    return json({ error: `update failed ${res.status}`, detail: t.slice(0, 300) }, 502);
  }
  return json({ ok: true });
});
