// 데이터 최신성 진단 스크립트.
// 각 소스별로 "현재 발행된 최신 자료"가 언제 것인지 확인한다.
// 다운로드 없이 메타데이터만 조회.
//
// 사용: node scripts/check_data_freshness.mjs
// 출력: 각 소스별 최신 기간/파일명, 로컬 캐시 날짜, 갱신 필요 여부

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { publicDataSources } from "./data_sources.mjs";

const root = process.cwd();
const rawDir = join(root, "data", "raw");
const TIMEOUT_MS = 15000;

// ── 유틸 ────────────────────────────────────────────────────────────────────
async function fetchSafe(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "foreign-resident-finance-dashboard/0.1 freshness-check" }
    });
    clearTimeout(t);
    return res;
  } catch (err) {
    clearTimeout(t);
    return { ok: false, status: 0, error: err.message };
  }
}

async function findLatestCached(source) {
  const files = await readdir(rawDir).catch(() => []);
  const match = files.filter((f) => f.startsWith(source.outputBaseName)).sort().at(-1);
  if (!match) return null;
  const dateMatch = match.match(/(\d{4}-\d{2}-\d{2})/);
  return { file: match, date: dateMatch?.[1] ?? "?" };
}

// ── data.go.kr 파일 소스 ─────────────────────────────────────────────────────
async function checkFileSource(source) {
  const detailUrl = `https://www.data.go.kr/data/${source.datasetId}/fileData.do`;
  const res = await fetchSafe(detailUrl);
  if (!res.ok) {
    return { status: "fetch_failed", error: res.error ?? `HTTP ${res.status}` };
  }
  const html = await res.text().catch(() => "");
  // 파일명에서 연도 추출
  const fileMatches = [...html.matchAll(/fn_fileDataDown\('[^']+'\s*,\s*'[^']+'\s*,[^,]*,\s*'[^']+'\s*,\s*'([^']+)'/g)]
    .map((m) => m[1]);
  const years = fileMatches
    .map((fn) => fn.match(/20([1-9]\d)/)?.[0])
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  // 페이지에서 수정일 추출(한국어: "수정일", "등록일" 등)
  const modDate = html.match(/(?:수정일|갱신일|최종수정일)[^0-9]*(\d{4}[-./]\d{1,2}[-./]\d{1,2})/)?.[1] ?? null;
  return {
    status: "ok",
    availableYears: [...new Set(years)].slice(0, 5),
    latestFileYear: years[0] ?? "unknown",
    pageModDate: modDate,
    resourceCount: fileMatches.length
  };
}

// ── KOSIS 소스 ──────────────────────────────────────────────────────────────
async function checkKosisSource(source, apiKey) {
  if (!apiKey) return { status: "no_key" };
  const url = new URL("https://kosis.kr/openapi/metaData.do");
  url.searchParams.set("method", "periodData");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("orgId", source.orgId);
  url.searchParams.set("tblId", source.tblId);
  url.searchParams.set("format", "json");

  const res = await fetchSafe(url);
  if (!res.ok) return { status: "fetch_failed", error: res.error ?? `HTTP ${res.status}` };
  const body = await res.json().catch(() => null);
  if (!Array.isArray(body) || body.length === 0) {
    return { status: "no_period_data", raw: String(body).slice(0, 100) };
  }
  const periods = body
    .map((r) => r.PRD_DE ?? r.prd_de ?? "")
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));
  return {
    status: "ok",
    latestPeriod: periods[0],
    availablePeriods: periods.slice(0, 8),
    totalPeriods: periods.length
  };
}

// ── OpenAPI 소스 ─────────────────────────────────────────────────────────────
async function checkOpenApiSource(source, apiKey) {
  if (!apiKey) return { status: "no_key" };
  // 가장 최근 연도부터 1년씩 내려가며 데이터가 있는 연도 확인
  const cy = new Date().getFullYear();
  for (let year = cy; year >= cy - 2; year--) {
    const url = new URL(source.endpoint);
    url.searchParams.set("serviceKey", apiKey);
    url.searchParams.set("type", "json");
    url.searchParams.set("numOfRows", "1");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("searchYear", String(year));

    const res = await fetchSafe(url);
    if (!res.ok) continue;
    const text = await res.text().catch(() => "");
    let body;
    try { body = JSON.parse(text); } catch { continue; }
    const items = [
      body?.response?.body?.items?.item,
      body?.items,
      Array.isArray(body) ? body : null
    ].find(Array.isArray);
    if (items?.length > 0) return { status: "ok", latestYear: year };
  }
  return { status: "no_data_found", checkedYears: [cy, cy - 1, cy - 2] };
}

// ── 메인 ────────────────────────────────────────────────────────────────────
async function main() {
  const kosisKey = process.env.KOSIS_API_KEY;
  const dataKey = process.env.DATA_GO_KR_SERVICE_KEY;

  console.log("=".repeat(72));
  console.log("데이터 최신성 진단 — " + new Date().toLocaleString("ko-KR"));
  console.log("=".repeat(72));

  const results = [];

  for (const source of publicDataSources) {
    process.stdout.write(`\n[${source.id}] 확인 중...`);

    const cached = await findLatestCached(source);
    let check;

    if (source.type === "file") {
      check = await checkFileSource(source);
    } else if (source.type === "kosis") {
      check = await checkKosisSource(source, kosisKey);
    } else if (source.type === "openapi") {
      check = await checkOpenApiSource(source, dataKey);
    } else {
      check = { status: "unknown_type" };
    }

    const cachedLabel = cached
      ? `캐시: ${cached.date} (${cached.file})`
      : "캐시 없음";

    let freshnessLabel = "?";
    if (check.status === "ok") {
      const latest = check.latestPeriod ?? check.latestFileYear ?? check.latestYear;
      const cy = new Date().getFullYear();
      if (latest && String(latest).startsWith(String(cy))) freshnessLabel = `✅ ${cy}년 최신`;
      else if (latest && String(latest).startsWith(String(cy - 1))) freshnessLabel = `⚠️  ${cy - 1}년 (${cy}년 미발행)`;
      else if (latest) freshnessLabel = `⚠️  ${latest}`;
    } else if (check.status === "no_key") {
      freshnessLabel = "🔑 API 키 없음";
    } else {
      freshnessLabel = `❌ ${check.status}`;
    }

    console.log(`\r[${source.id}]`);
    console.log(`  제공기관: ${source.provider}`);
    console.log(`  최신 자료: ${freshnessLabel}`);
    if (check.availablePeriods) console.log(`  제공 기간: ${check.availablePeriods.join(", ")}`);
    if (check.availableYears?.length) console.log(`  파일 연도: ${check.availableYears.join(", ")}, 리소스 ${check.resourceCount}개`);
    if (check.pageModDate) console.log(`  페이지 수정일: ${check.pageModDate}`);
    console.log(`  로컬 ${cachedLabel}`);

    results.push({ id: source.id, type: source.type, freshnessLabel, cached: cached?.date ?? null, check });
  }

  // 요약
  console.log("\n" + "=".repeat(72));
  console.log("요약");
  console.log("=".repeat(72));
  const byStatus = {
    latest: results.filter((r) => r.freshnessLabel.startsWith("✅")),
    stale: results.filter((r) => r.freshnessLabel.startsWith("⚠️")),
    error: results.filter((r) => r.freshnessLabel.startsWith("❌") || r.freshnessLabel.startsWith("🔑"))
  };
  console.log(`✅ 최신(${byStatus.latest.length}): ${byStatus.latest.map((r) => r.id).join(", ") || "없음"}`);
  console.log(`⚠️  이전연도(${byStatus.stale.length}): ${byStatus.stale.map((r) => r.id).join(", ") || "없음"}`);
  console.log(`❌ 오류/미확인(${byStatus.error.length}): ${byStatus.error.map((r) => r.id).join(", ") || "없음"}`);

  console.log("\n[도움말]");
  console.log("- ⚠️ 소스는 최신 자료가 아직 발행 전이거나 업데이트 주기가 연 1회인 경우입니다.");
  console.log("- ✅ 소스도 더 최신 데이터(월별)가 있을 수 있습니다. KOSIS 월별(prdSe=M)을 추가 검토하세요.");
  console.log("- 운영 환경에서 실행: KOSIS_API_KEY=... DATA_GO_KR_SERVICE_KEY=... node scripts/check_data_freshness.mjs");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
