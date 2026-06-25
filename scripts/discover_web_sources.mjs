// AI 웹 발굴 에이전트 — data.go.kr 한정을 넘어 '전 인터넷'에서 국내 거주 외국인 금융 분석에
// 쓸 수 있는 데이터 출처를 Claude + 웹 검색으로 발굴해 제안한다.
//
// (1) 이미 보유한 소스(data_sources.mjs)를 컨텍스트로 주어 중복 제안을 줄이고,
// (2) Claude(Anthropic) + web_search 로 KOSIS·통계청·한국은행 ECOS·금융위/FSS·지자체 열린데이터·
//     국립국제교육원·IOM·OECD·World Bank(KNOMAD)·이민정책연구원 등 전 인터넷을 탐색해,
// (3) 구조화된 '데이터 리드' 목록을 lib/data/generated/webDiscoveredSources.json 에 쓴다.
//
// ⚠️ 안전 원칙: 여기서 나온 리드는 자동 수집 대상이 아니라 '사람이 검토할 후보'다.
//    수집기(fetch_public_data)는 아는 타입(file/openapi/kosis/ecos/seoul)만 수집하므로
//    임의 웹 URL 이 자동 ingest 되는 일은 없다(임의 URL fetch=SSRF 방지).
// ⚠️ ANTHROPIC_API_KEY 가 있을 때만 AI 발굴. 없으면 기존 파일 유지(폴백). 항상 종료코드 0.

import { readFile, writeFile } from "node:fs/promises";
import { publicDataSources } from "./data_sources.mjs";

const OUT = "lib/data/generated/webDiscoveredSources.json";
const MODEL = process.env.LLM_MODEL || "claude-opus-4-8";
const MAX_LEADS = 60;
const nowIso = new Date().toISOString();

const DOMAINS = [
  "체류·인구",
  "유학생",
  "고용·소득",
  "송금·환전",
  "금융이용",
  "다문화·가족",
  "사회보험",
  "지역·지자체",
  "거시·정책"
];
const SCOPES = ["국내", "해외", "국제기구"];
const DATA_TYPES = ["통계표", "API", "파일(CSV/XLSX)", "대시보드", "보고서/PDF", "마이크로데이터"];
const ACCESS = ["공개 API", "KOSIS", "data.go.kr 활용신청", "파일 다운로드", "웹/대시보드", "수동/문의"];
const PII = ["낮음", "중간", "높음"];
const CONF = ["high", "med", "low"];

// 이미 보유한 출처(중복 제안 억제용 컨텍스트).
function registeredInventory() {
  return publicDataSources.map((s) => ({
    provider: s.provider ?? "",
    title: s.title ?? s.id,
    ref: s.tblId || s.datasetId || s.id || ""
  }));
}

async function loadExisting() {
  try {
    const d = JSON.parse(await readFile(OUT, "utf8"));
    if (d && Array.isArray(d.leads)) return d;
  } catch {
    /* 최초 실행 */
  }
  return { version: 1, generatedAt: null, source: "none", model: null, leads: [], domains: [] };
}

// 응답 텍스트에서 JSON 배열 추출(코드블록 우선, 없으면 마지막 [...]).
function parseLeads(text) {
  const fence = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  const candidates = [];
  if (fence) candidates.push(fence[1]);
  const lastArr = text.lastIndexOf("[");
  if (lastArr >= 0) candidates.push(text.slice(lastArr, text.lastIndexOf("]") + 1));
  for (const c of candidates) {
    try {
      const arr = JSON.parse(c);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {
      /* 다음 후보 */
    }
  }
  return null;
}

const pick = (set, v, fallback) => (set.includes(v) ? v : fallback);
const str = (v, n) => String(v ?? "").slice(0, n).trim();

// 정규화 + enum 클램프 + URL 중복 제거 + 상한.
function normalize(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!x || typeof x.title !== "string" || typeof x.url !== "string") continue;
    if (!/^https?:\/\//i.test(x.url)) continue;
    const key = x.url.replace(/[#?].*$/, "").replace(/\/+$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      title: str(x.title, 140),
      provider: str(x.provider, 80),
      url: str(x.url, 400),
      scope: pick(SCOPES, x.scope, "국내"),
      domain: pick(DOMAINS, x.domain, "거시·정책"),
      dataType: pick(DATA_TYPES, x.dataType, "통계표"),
      accessMethod: pick(ACCESS, x.accessMethod, "웹/대시보드"),
      cadence: str(x.cadence, 40),
      relevance: str(x.relevance, 400),
      suggestedTarget: str(x.suggestedTarget, 60),
      piiRisk: pick(PII, x.piiRisk, "중간"),
      confidence: pick(CONF, x.confidence, "med")
    });
    if (out.length >= MAX_LEADS) break;
  }
  return out;
}

async function aiDiscover(inventory) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch (e) {
    console.warn("webDiscovery: @anthropic-ai/sdk 미설치 → 폴백", e.message);
    return null;
  }
  const client = new Anthropic({ apiKey });

  const invText = inventory.map((s) => `- ${s.provider} ${s.title} (${s.ref})`).join("\n");

  const system = `당신은 한국 은행·캐피탈을 위한 '국내 거주 외국인 금융 시장' 데이터 발굴 전문가입니다.
목표: 우리 대시보드에 추가하면 좋을 '외국인 관련 데이터 출처'를 data.go.kr 에 한정하지 말고 전 인터넷에서 찾아 제안하세요.

탐색 대상(예시, 이에 한정하지 말 것):
- 국내: KOSIS(통계청), 통계청 MDIS 마이크로데이터, 한국은행 ECOS, 금융위/금융감독원 금융통계정보시스템, 행안부·법무부·고용노동부·교육부(국립국제교육원), 각 지자체 열린데이터광장(서울/경기/인천 등), 건강보험·국민연금 공단.
- 해외/국제기구: OECD(International Migration·SOPEMI), World Bank(KNOMAD 송금·Remittance Prices), UN DESA(International Migrant Stock), IOM, 이민정책연구원(MRTC), 한국이민학회 등.

규칙:
- 각 리드는 '집계 통계'여야 한다. 개인식별정보(외국인등록번호·여권번호·성명·주소·전화·계좌)가 핵심인 명부성 데이터는 제안하지 말 것. 마이크로데이터라도 집계 가능한 공식 통계만.
- 이미 보유한 출처[보유 인벤토리]와 중복되는 것은 제외하거나, 더 세분화된 신규 표만 제안.
- 추측 금지. 웹 검색으로 실재가 확인된 출처만. url 은 실제 접근 가능한 페이지로.
- 한국어. 마지막에 아래 JSON 배열만 \`\`\`json 코드블록으로 출력.

[JSON 형식]
\`\`\`json
[{
  "title":"데이터/통계 이름",
  "provider":"발행 기관",
  "url":"https://실제접근URL",
  "scope":"${SCOPES.join("|")}",
  "domain":"${DOMAINS.join("|")}",
  "dataType":"${DATA_TYPES.join("|")}",
  "accessMethod":"${ACCESS.join("|")}",
  "cadence":"갱신주기(예: 연간)",
  "relevance":"왜 외국인 금융 분석에 유용한지 1~2문장",
  "suggestedTarget":"추정 활용축(국적/지역/유학생/소득·고용/송금 등)",
  "piiRisk":"${PII.join("|")}",
  "confidence":"${CONF.join("|")}"
}]
\`\`\``;

  const user = `[보유 인벤토리]\n${invText || "(없음)"}\n\n위 보유분과 겹치지 않는, 추가하면 가치 있는 외국인 관련 데이터 출처를 전 인터넷에서 최대한 폭넓게(도메인 ${DOMAINS.length}종을 고루) 발굴해 제안하세요. 실재를 웹 검색으로 확인하고 ${MAX_LEADS}건 이내로.`;

  const tools = [{ type: "web_search_20260209", name: "web_search" }];
  let messages = [{ role: "user", content: user }];
  let text = "";

  // 서버측 웹검색 루프가 pause_turn 으로 끊기면 최대 7회 이어서 진행(폭넓은 탐색).
  for (let i = 0; i < 8; i += 1) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 12000,
      thinking: { type: "adaptive" },
      system,
      tools,
      messages
    });
    for (const b of res.content ?? []) if (b.type === "text" && b.text) text += b.text;
    if (res.stop_reason !== "pause_turn") break;
    messages = [...messages, { role: "assistant", content: res.content }];
  }

  const parsed = parseLeads(text);
  if (!parsed) {
    console.warn("webDiscovery: AI 응답에서 JSON 파싱 실패 → 폴백");
    return null;
  }
  const norm = normalize(parsed);
  return norm.length ? norm : null;
}

function domainCounts(leads) {
  const m = new Map();
  for (const l of leads) m.set(l.domain, (m.get(l.domain) ?? 0) + 1);
  return [...m.entries()].map(([domain, count]) => ({ domain, count })).sort((a, b) => b.count - a.count);
}

async function main() {
  const inventory = registeredInventory();
  const existing = await loadExisting();

  let leads = null;
  try {
    leads = await aiDiscover(inventory);
  } catch (e) {
    console.warn("webDiscovery: AI 호출 실패 → 폴백:", e?.message ?? e);
  }

  if (!leads) {
    // 폴백: 기존 시드/직전 결과를 그대로 유지(빈 파일로 덮어쓰지 않음).
    console.log(`webDiscovery: AI 미연동/실패 — 기존 ${existing.leads.length}건 유지 → ${OUT}`);
    if (!existing.generatedAt) {
      await writeFile(OUT, JSON.stringify({ ...existing, version: 1 }, null, 2) + "\n", "utf8");
    }
    return;
  }

  const payload = {
    version: 1,
    generatedAt: nowIso,
    source: "ai",
    model: MODEL,
    leads,
    domains: domainCounts(leads)
  };
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`webDiscovery: ${leads.length}건 리드 발굴(${domainCounts(leads).length}개 도메인) → ${OUT}`);
}

main().catch((e) => {
  // 어떤 실패도 배치를 끊지 않는다.
  console.warn("webDiscovery 실패(무시):", e?.message ?? e);
});
