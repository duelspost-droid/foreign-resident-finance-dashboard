import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function authHeaders() {
  return { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
}

function toSnakeStatus(row) {
  return {
    id: Number(String(row.id).replace(/\D/g, "")) || undefined,
    base_year: row.baseYear,
    nationality: row.nationality,
    visa_code: row.visaCode,
    visa_name: row.visaName,
    segment_type: row.segmentType,
    resident_count: row.residentCount,
    financial_need_tags: row.financialNeedTags,
    source_name: row.sourceName,
    source_url: row.sourceUrl
  };
}

function toSnakeRegion(row) {
  return {
    id: Number(String(row.id).replace(/\D/g, "")) || undefined,
    base_month: row.baseMonth,
    sido: row.sido,
    sigungu: row.sigungu,
    nationality: row.nationality,
    gender: row.gender,
    resident_count: row.residentCount,
    short_term_count: row.shortTermCount,
    long_term_count: row.longTermCount,
    yoy_change_rate: row.yoyChangeRate,
    mom_change_rate: row.momChangeRate,
    source_name: row.sourceName
  };
}

// ── 현행: 대시보드용 정규화 테이블 upsert(최신 상태) ────────────────────────────────
async function supabaseUpsert(path, rows) {
  if (rows.length === 0) return { path, count: 0 };
  const url = `${supabaseUrl}/rest/v1/${path}?on_conflict=id`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error(`${path} upsert failed: ${res.status} ${await res.text()}`);
  return { path, count: rows.length };
}

async function loadNormalizedTables() {
  const statusRows = await readJson(join(root, "data", "processed", "foreign_resident_status.real.json")).catch(() => []);
  const regionRows = await readJson(join(root, "data", "processed", "foreign_resident_region_month.real.json")).catch(() => []);
  const status = statusRows.map(toSnakeStatus).filter((r) => r.id);
  const region = regionRows.map(toSnakeRegion).filter((r) => r.id);
  if (DRY_RUN) {
    return [{ path: "foreign_resident_status", count: status.length, dryRun: true }, { path: "foreign_resident_region_month", count: region.length, dryRun: true }];
  }
  return [await supabaseUpsert("foreign_resident_status", status), await supabaseUpsert("foreign_resident_region_month", region)];
}

// ── 신규: 분석용 웨어하우스(이력 누적) — batch_date·source 단위 delete 후 insert(멱등) ──
async function loadWarehouse() {
  const payload = await readJson(join(root, "data", "processed", "metric_snapshots.json")).catch(() => null);
  if (!payload || !Array.isArray(payload.rows) || payload.rows.length === 0) {
    return { table: "metric_snapshots", status: "skipped (no snapshots file)" };
  }
  const { batchDate, rows } = payload;
  const sources = [...new Set(rows.map((r) => r.source))];

  if (DRY_RUN) {
    return { table: "metric_snapshots", status: "dry-run", batchDate, rows: rows.length, sources: sources.length };
  }

  // 같은 batch_date의 각 source 기존 행 제거(재실행 멱등성).
  for (const source of sources) {
    const url = `${supabaseUrl}/rest/v1/metric_snapshots?batch_date=eq.${encodeURIComponent(batchDate)}&source=eq.${encodeURIComponent(source)}`;
    const res = await fetch(url, { method: "DELETE", headers: authHeaders() });
    if (!res.ok) throw new Error(`metric_snapshots delete failed (${source}): ${res.status} ${await res.text()}`);
  }
  // 청크 삽입.
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const res = await fetch(`${supabaseUrl}/rest/v1/metric_snapshots`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(chunk)
    });
    if (!res.ok) throw new Error(`metric_snapshots insert failed: ${res.status} ${await res.text()}`);
    inserted += chunk.length;
  }
  return { table: "metric_snapshots", status: "loaded", batchDate, inserted, sources: sources.length };
}

async function main() {
  if (!DRY_RUN && (!supabaseUrl || !serviceRoleKey)) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (or pass --dry-run).");
  }
  const normalized = await loadNormalizedTables();
  const warehouse = await loadWarehouse();
  console.log(JSON.stringify({ ok: true, dryRun: DRY_RUN, normalized, warehouse }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
