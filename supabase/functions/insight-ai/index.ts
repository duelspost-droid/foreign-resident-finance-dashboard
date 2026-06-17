// 외국인 금융 인사이트 — 생성형 AI 질의 Edge Function (Supabase / Deno).
//
// 배포(소유자 1회):
//   supabase functions deploy insight-ai --no-verify-jwt
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   (선택) supabase secrets set LLM_MODEL=claude-sonnet-4-6
//
// 프런트(InsightChat)는 NEXT_PUBLIC_SUPABASE_URL/ANON_KEY가 설정돼 있으면 이 함수를 호출하고,
// 실패/미설정 시 클라이언트 데이터 엔진으로 폴백한다.
//
// 주의: 이 파일은 Deno 런타임 전용이라 Next 앱 tsconfig 타입체크 대상에서 제외된다.

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "content-type": "application/json" }
  });
}

// @ts-ignore Deno global (Edge runtime)
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // @ts-ignore Deno global
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY 미설정" }, 500);
  // @ts-ignore Deno global
  const model = Deno.env.get("LLM_MODEL") ?? "claude-sonnet-4-6";

  let body: { question?: string; context?: string; history?: { q: string; a: string }[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  const question = (body.question ?? "").trim();
  if (!question) return json({ error: "question required" }, 400);
  const context = body.context ?? "";
  const history = Array.isArray(body.history) ? body.history.slice(-4) : [];

  const system = `당신은 '외국인 금융 인사이트' B2B 대시보드의 데이터 분석 어시스턴트입니다.
아래 [데이터 컨텍스트]에 근거해서만 한국어로 간결하고 구체적으로 답하세요.
- 숫자는 반드시 컨텍스트의 값을 사용하고, 컨텍스트에 없는 사실은 추측하지 말고 "해당 데이터가 없습니다"라고 답하세요.
- 은행·캐피탈·핀테크 관점의 실무 시사점을 1~2문장 덧붙이세요.
- 답변은 3~6문장 이내로 간결하게.

[데이터 컨텍스트]
${context}`;

  const messages = [
    ...history.flatMap((h) => [
      { role: "user", content: h.q },
      { role: "assistant", content: h.a }
    ]),
    { role: "user", content: question }
  ];

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({ model, max_tokens: 700, system, messages })
    });
    if (!r.ok) {
      const t = await r.text();
      return json({ error: `LLM ${r.status}`, detail: t.slice(0, 300) }, 502);
    }
    const data = await r.json();
    const answer = (data?.content ?? [])
      .map((c: { text?: string }) => c.text ?? "")
      .join("")
      .trim();
    return json({ answer: answer || "답변을 생성하지 못했습니다." });
  } catch (e) {
    return json({ error: String(e) }, 502);
  }
});
