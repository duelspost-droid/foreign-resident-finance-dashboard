// 가상 외국인정보(mock_residents)를 '전용' Supabase 프로젝트에 적재(소유자용).
//
// psql이 없거나 REST로 넣고 싶을 때 사용. 단일 출처는 lib/data/mockResidents.ts.
// id 기준 upsert(merge-duplicates)라 재실행해도 멱등.
//
// 전제: 먼저 db/mock_residents/schema.sql 로 테이블 생성.
// 사용:
//   MOCK_SUPABASE_URL=https://xxxx.supabase.co \
//   MOCK_SUPABASE_SERVICE_ROLE_KEY=sb_secret_... \
//   node scripts/load_mock_residents.mjs                 # 10만 건
//   node scripts/load_mock_residents.mjs --count 5000    # 건수 지정
//   node scripts/load_mock_residents.mjs --dry-run       # 네트워크 없이 매핑만 확인
//
// ⚠️ service_role 키는 절대 커밋/프론트에 두지 말 것(서버·CLI 전용).
// ※ 대량은 psql COPY(db/mock_residents/seed.sql)가 더 빠르다. 이 스크립트는 REST 대안.

import { mockResidentAt, MOCK_TOTAL } from "../lib/data/mockResidents.ts";

const url = process.env.MOCK_SUPABASE_URL ?? process.env.NEXT_PUBLIC_MOCK_SUPABASE_URL;
const serviceRoleKey = process.env.MOCK_SUPABASE_SERVICE_ROLE_KEY;
const argv = process.argv.slice(2);
const DRY_RUN = process.env.DRY_RUN === "1" || argv.includes("--dry-run");

function argValue(flag, fallback) {
  const i = argv.indexOf(flag);
  if (i === -1 || i + 1 >= argv.length) return fallback;
  return argv[i + 1];
}

const count = Math.max(0, Number(argValue("--count", MOCK_TOTAL)) || MOCK_TOTAL);
const CHUNK = 1000;

// MockResident(UI) → DB row(snake_case).
function toRow(r) {
  return {
    id: r.id,
    name: r.name,
    gender: r.gender,
    birth_date: r.birth,
    rrn_masked: r.rrn,
    frn_masked: r.frn,
    nationality: r.nationality,
    visa: r.visa,
    sido: r.sido,
    sigungu: r.sigungu,
    registered_at: r.registeredAt
  };
}

async function main() {
  if (!DRY_RUN && (!url || !serviceRoleKey)) {
    throw new Error("MOCK_SUPABASE_URL and MOCK_SUPABASE_SERVICE_ROLE_KEY are required (or pass --dry-run).");
  }

  let sent = 0;
  for (let i = 0; i < count; i += CHUNK) {
    const end = Math.min(i + CHUNK, count);
    const rows = [];
    for (let j = i; j < end; j += 1) rows.push(toRow(mockResidentAt(j)));

    if (DRY_RUN) {
      sent += rows.length;
      continue;
    }

    const res = await fetch(`${url}/rest/v1/mock_residents?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(rows)
    });
    if (!res.ok) throw new Error(`mock_residents insert failed at ${i}: ${res.status} ${await res.text()}`);
    sent += rows.length;
  }

  console.log(JSON.stringify({ ok: true, dryRun: DRY_RUN, rows: sent, table: "mock_residents" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
