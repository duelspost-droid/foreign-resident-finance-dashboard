import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
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

async function supabaseRequest(path, rows) {
  if (rows.length === 0) return { path, count: 0 };

  const url = `${supabaseUrl}/rest/v1/${path}?on_conflict=id`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    throw new Error(`${path} upsert failed: ${res.status} ${await res.text()}`);
  }

  return { path, count: rows.length };
}

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const statusRows = await readJson(
    join(root, "data", "processed", "foreign_resident_status.real.json")
  ).catch(() => []);
  const regionRows = await readJson(
    join(root, "data", "processed", "foreign_resident_region_month.real.json")
  ).catch(() => []);

  const results = [];
  results.push(
    await supabaseRequest(
      "foreign_resident_status",
      statusRows.map(toSnakeStatus).filter((row) => row.id)
    )
  );
  results.push(
    await supabaseRequest(
      "foreign_resident_region_month",
      regionRows.map(toSnakeRegion).filter((row) => row.id)
    )
  );

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
