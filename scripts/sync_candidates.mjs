// 발굴 후보 동기화: 매일 배치가 자동 발굴한 신규 데이터셋 후보를 Supabase 승인 큐에 적재한다.
// - 최신 수집 카탈로그(latest_fetch_catalog.json)의 discovery.links 를 읽어
//   아직 등록되지 않은(=publicDataSources 에 없는) datasetId 를 'pending' 으로 upsert.
// - Supabase 미연결(환경변수 없음) 시 graceful no-op.
// - 승인된 후보 목록을 data/registry/approved_candidates.json 으로 내려받아
//   수집기(fetch_public_data.mjs)가 동적으로 등록·수집할 수 있게 한다.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { publicDataSources } from "./data_sources.mjs";

const root = process.cwd();
const catalogPath = join(root, "data", "catalog", "latest_fetch_catalog.json");
const registryDir = join(root, "data", "registry");

// 공개 안전 기본값(URL + publishable 키). source_candidates 는 RLS 가 공개 쓰기를 허용하므로
// service_role 없이도 후보 큐 적재가 가능하다. service_role 이 있으면 그것을 우선 사용.
const PUBLIC_URL = "https://nrdapzgtibbusvoaceuh.supabase.co";
const PUBLIC_ANON_KEY = "sb_publishable_DckNy92c8WFGYWNPRsEjag_q-JQs9km";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? PUBLIC_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  PUBLIC_ANON_KEY;

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function registeredDatasetIds() {
  const ids = new Set();
  for (const s of publicDataSources) {
    if (s.datasetId) ids.add(String(s.datasetId));
    if (s.tblId) ids.add(String(s.tblId));
  }
  return ids;
}

async function main() {
  await mkdir(registryDir, { recursive: true });

  const catalog = await readJson(catalogPath, {});
  const registered = registeredDatasetIds();

  // 카탈로그 discovery 에서 미등록 후보 추출(중복 제거)
  const seen = new Set();
  const candidates = [];
  for (const d of catalog?.discovery ?? []) {
    for (const l of d.links ?? []) {
      const key = `${l.datasetId}:${l.kind}`;
      if (seen.has(key) || registered.has(String(l.datasetId))) continue;
      seen.add(key);
      candidates.push({
        dataset_id: String(l.datasetId),
        kind: l.kind,
        provider: d.provider ?? null,
        title: null,
        keyword: d.keyword ?? null,
        url: l.url ?? null,
        priority: "mid",
        rationale: d.purpose ?? null,
        status: "pending"
      });
    }
  }

  console.log(`[sync_candidates] 미등록 발굴 후보: ${candidates.length}건`);

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("[sync_candidates] Supabase 미연결 — 큐 동기화 건너뜀(no-op).");
    // 미연결 시에도 후보 스냅샷은 파일로 남겨 추적 가능하게 한다.
    await writeFile(
      join(registryDir, "pending_candidates.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), candidates }, null, 2),
      "utf8"
    );
    return;
  }

  const client = createClient(supabaseUrl, serviceRoleKey);

  // 신규 후보 upsert (dataset_id+kind 충돌 시 무시 — 기존 승인 상태 보존)
  if (candidates.length > 0) {
    const { error } = await client
      .from("source_candidates")
      .upsert(candidates, { onConflict: "dataset_id,kind", ignoreDuplicates: true });
    if (error) console.error("[sync_candidates] upsert 오류:", error.message);
    else console.log(`[sync_candidates] ${candidates.length}건 upsert 완료`);
  }

  // 승인된 후보를 레지스트리 파일로 내려받기 (수집기가 동적 등록에 사용)
  const { data: approved, error: readErr } = await client
    .from("source_candidates")
    .select("*")
    .eq("status", "approved");
  if (readErr) {
    console.error("[sync_candidates] 승인 목록 조회 오류:", readErr.message);
    return;
  }
  await writeFile(
    join(registryDir, "approved_candidates.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), approved: approved ?? [] }, null, 2),
    "utf8"
  );
  console.log(`[sync_candidates] 승인된 후보 ${approved?.length ?? 0}건 레지스트리 기록`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
