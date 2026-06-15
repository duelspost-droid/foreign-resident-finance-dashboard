// Supabase 연결 점검 스크립트.
// 환경변수(SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL + 키)로 접속해 필수 테이블 존재를 확인한다.
// 사용: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/check_supabase.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const TABLES = [
  "foreign_resident_region_month",
  "foreign_resident_status",
  "foreign_student_university",
  "finance_segment_aggregate",
  "region_finance_score",
  "source_candidates"
];

async function main() {
  if (!url || !key) {
    console.error("❌ 환경변수 없음: SUPABASE_URL + (SERVICE_ROLE 또는 ANON) 키를 설정하세요.");
    process.exitCode = 1;
    return;
  }
  console.log(`연결 대상: ${url}`);
  const client = createClient(url, key);

  let ok = 0;
  for (const t of TABLES) {
    const { error, count } = await client
      .from(t)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.log(`❌ ${t}: ${error.message}`);
    } else {
      console.log(`✅ ${t}: 접근 OK (행수 ${count ?? "?"})`);
      ok += 1;
    }
  }
  console.log(`\n${ok}/${TABLES.length} 테이블 확인됨`);
  if (ok < TABLES.length) {
    console.log("→ 누락 테이블은 supabase/schema.sql 을 SQL Editor 에 적용하세요.");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
