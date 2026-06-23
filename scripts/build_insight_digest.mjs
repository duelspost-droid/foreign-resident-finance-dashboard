// 매일 '금융 인사이트 제안' 생성기.
// (1) 수집 데이터 인벤토리(data/catalog/latest_fetch_catalog.json)를 컨텍스트로,
// (2) Claude(Anthropic) + 웹 검색으로 국내 외국인 대상 금융(은행·캐피탈·송금·환전) 최신 동향을 조사·결합해
// (3) 은행·캐피탈용 인사이트 4~6개를 만들어 lib/data/generated/insightDigest.json 에 날짜별로 누적(최근 30일)한다.
// 금융 인사이트 페이지가 이 JSON 을 정적 import 해 '오늘의 인사이트 + 히스토리'로 렌더한다.
//
// ⚠️ ANTHROPIC_API_KEY(환경변수/CI 시크릿) 가 있을 때만 웹+AI 제안. 없으면 수집 데이터만으로 결정적 요약(폴백).
// 어떤 경우에도 종료코드 0 — 데이터 배치 체인을 끊지 않는다.

import { readFile, writeFile } from "node:fs/promises";

const CATALOG = "data/catalog/latest_fetch_catalog.json";
const OUT = "lib/data/generated/insightDigest.json";
const MAX_DAYS = 30;
const MODEL = process.env.LLM_MODEL || "claude-opus-4-8";
const today = new Date().toISOString().slice(0, 10);
const nowIso = new Date().toISOString();

// ── 수집 데이터 인벤토리 로드(성공 수집된 소스만, 컨텍스트로 사용) ──
async function loadInventory() {
  try {
    const cat = JSON.parse(await readFile(CATALOG, "utf8"));
    const ok = new Set(["downloaded", "cached", "metadata_failed_using_cached_raw", "metadata_without_file_using_cached_raw"]);
    return (cat.sources ?? [])
      .filter((s) => ok.has(s?.result?.status))
      .map((s) => ({
        provider: s.provider ?? "",
        title: s.title ?? s.id,
        category: s.category ?? "",
        rows: s?.result?.rowCount ?? null,
        cycle: s.updateCycle ?? "",
        note: (s.notes ?? "").slice(0, 80)
      }));
  } catch {
    return [];
  }
}

async function loadExisting() {
  try {
    const d = JSON.parse(await readFile(OUT, "utf8"));
    if (d && Array.isArray(d.days)) return d;
  } catch { /* 최초 실행 등 — 새로 시작 */ }
  return { version: 1, days: [] };
}

// 응답 텍스트에서 JSON 배열 추출(코드블록 우선, 없으면 마지막 [...] 시도).
function parseInsights(text) {
  const fence = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  const candidates = [];
  if (fence) candidates.push(fence[1]);
  const lastArr = text.lastIndexOf("[");
  if (lastArr >= 0) candidates.push(text.slice(lastArr, text.lastIndexOf("]") + 1));
  for (const c of candidates) {
    try {
      const arr = JSON.parse(c);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch { /* 다음 후보 */ }
  }
  return null;
}

function normalize(arr) {
  const CATS = new Set(["송금", "수신", "여신", "지역전략", "규제·컴플라이언스", "시장동향", "상품기획"]);
  const AUD = new Set(["은행", "캐피탈", "공통"]);
  return arr
    .filter((x) => x && typeof x.title === "string" && typeof x.body === "string")
    .slice(0, 6)
    .map((x) => ({
      title: String(x.title).slice(0, 120).trim(),
      body: String(x.body).slice(0, 600).trim(),
      category: CATS.has(x.category) ? x.category : "시장동향",
      audience: AUD.has(x.audience) ? x.audience : "공통",
      sources: Array.isArray(x.sources) ? x.sources.map((s) => String(s).slice(0, 80)).slice(0, 5) : []
    }));
}

// ── 웹 + AI 제안(ANTHROPIC_API_KEY 있을 때만) ──
async function aiInsights(inventory) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch (e) {
    console.warn("insightDigest: @anthropic-ai/sdk 미설치 → 폴백", e.message);
    return null;
  }
  const client = new Anthropic({ apiKey });

  const invText = inventory
    .map((s) => `- [${s.category}] ${s.provider} ${s.title}${s.rows != null ? ` (${s.rows.toLocaleString()}행)` : ""}${s.cycle ? ` · ${s.cycle}` : ""}`)
    .join("\n");

  const system = `당신은 한국 은행·캐피탈 업계를 위한 '국내 거주 외국인 금융' 전략 애널리스트입니다.
아래 [수집 데이터 인벤토리]는 우리 대시보드가 매일 수집하는 공공데이터입니다.
웹 검색으로 '국내 외국인 대상 금융(은행·캐피탈·핀테크·송금·환전·체류/비자 정책)'의 최신 동향·뉴스·규제·시장 변화를 조사하고,
수집 데이터와 결합해 은행·캐피탈이 바로 활용할 인사이트 4~6개를 제안하세요.
규칙:
- 각 인사이트는 (1) 무엇이 변했는지/기회인지 (2) 우리 수집데이터 또는 외국인 금융 도메인과의 연결 (3) 은행·캐피탈 실행 시사점을 담는다.
- 추측·과장 금지. 웹에서 확인한 사실에 근거하고, 출처가 있으면 sources에 매체/기관명을 넣는다.
- 한국어. 설명을 길게 늘어놓지 말고, 마지막에 아래 JSON 배열만 \`\`\`json 코드블록으로 출력한다.

[JSON 형식]
\`\`\`json
[{"title":"한 줄 제목","category":"송금|수신|여신|지역전략|규제·컴플라이언스|시장동향|상품기획","audience":"은행|캐피탈|공통","body":"2~3문장 본문(은행/캐피탈 시사점 포함)","sources":["출처명"]}]
\`\`\``;

  const user = `[수집 데이터 인벤토리]\n${invText || "(수집 인벤토리 비어 있음)"}\n\n오늘(${today}) 기준으로 위 규칙에 따라 인사이트를 제안하세요. 최근 동향을 웹에서 검색해 반영하세요.`;

  const tools = [{ type: "web_search_20260209", name: "web_search" }];
  let messages = [{ role: "user", content: user }];
  let text = "";

  // 서버 측 웹검색 루프가 pause_turn 으로 끊기면 최대 3회 이어서 진행.
  for (let i = 0; i < 4; i += 1) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system,
      tools,
      messages
    });
    for (const b of res.content ?? []) if (b.type === "text" && b.text) text += b.text;
    if (res.stop_reason !== "pause_turn") break;
    messages = [...messages, { role: "assistant", content: res.content }];
  }

  const parsed = parseInsights(text);
  if (!parsed) {
    console.warn("insightDigest: AI 응답에서 JSON 파싱 실패 → 폴백");
    return null;
  }
  const norm = normalize(parsed);
  return norm.length ? norm : null;
}

// ── 폴백: 수집 데이터만으로 결정적 요약(AI 미연동/실패 시) ──
function fallbackInsights(inventory) {
  const top = [...inventory].sort((a, b) => (b.rows ?? 0) - (a.rows ?? 0)).slice(0, 3);
  if (top.length === 0) {
    return [{
      title: "수집 데이터 점검 필요",
      body: "오늘 수집 인벤토리가 비어 있습니다. 데이터 배치(공공데이터 수집)를 점검하세요.",
      category: "시장동향",
      audience: "공통",
      sources: ["내부 수집 파이프라인"]
    }];
  }
  return top.map((s) => ({
    title: `${s.title} 갱신 — 세그먼트 영업 기준 데이터`,
    body: `${s.provider} '${s.title}'${s.rows != null ? `(${s.rows.toLocaleString()}행)` : ""} 데이터가 최신 수집됐습니다. 국적·체류자격·지역 단위로 외국인 고객 세그먼트를 갱신해 급여계좌·송금·체크카드 영업 우선순위에 반영할 수 있습니다.`,
    category: s.category?.includes("경제") || s.category?.includes("소득") ? "여신" : "지역전략",
    audience: "공통",
    sources: [`${s.provider} ${s.title}`]
  }));
}

async function main() {
  const inventory = await loadInventory();
  const store = await loadExisting();

  let insights = null;
  let source = "ai";
  try {
    insights = await aiInsights(inventory);
  } catch (e) {
    console.warn("insightDigest: AI 호출 실패 → 폴백:", e?.message ?? e);
  }
  if (!insights) {
    insights = fallbackInsights(inventory);
    source = "data";
  }

  const day = { date: today, generatedAt: nowIso, source, insights };
  const days = [day, ...store.days.filter((d) => d.date !== today)]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, MAX_DAYS);

  await writeFile(OUT, JSON.stringify({ version: 1, days }, null, 2) + "\n", "utf8");
  console.log(`insightDigest: ${today} (${source}) · ${insights.length}건 · 누적 ${days.length}일 → ${OUT}`);
}

main().catch((e) => {
  // 어떤 실패도 배치를 끊지 않는다.
  console.warn("insightDigest 실패(무시):", e?.message ?? e);
});
