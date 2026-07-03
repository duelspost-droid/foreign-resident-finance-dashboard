// 가상 외국인정보(mock_residents) Postgres 읽기 레이어.
//
// ⚠️ 합성(가상) 데이터 전용 테이블이다. 실제 집계 분석 테이블과 분리된 별도 테이블이며,
// 조회(SELECT)만 허용하는 RLS로 격리돼 있다(집계 전용 원칙 유지).
//
// 대상 DB: NEXT_PUBLIC_MOCK_SUPABASE_* 가 설정되면 그 '전용 프로젝트'를, 아니면 기존
// 대시보드 Supabase(동일 프로젝트의 mock_residents 테이블)를 바라본다. 화면은 마운트 시
// 이 테이블을 '프로브'해서, 데이터가 있으면 DB 모드로, 없거나(테이블 부재) 오류면
// 클라이언트 생성 모드로 폴백한다 → 테이블 준비 여부와 무관하게 항상 동작.
//
// 정적 export(GitHub Pages)라 런타임 서버가 없어 클라이언트 supabase-js + anon 키로만
// 접근한다. 큰 표라서 서버 페이지네이션(.range) + 정확 카운트(count:'exact')를 쓴다.

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "./supabaseConfig";
import type { MockResident } from "./mockResidents";

// 전용 프로젝트가 지정되면 그걸, 아니면 기존 대시보드 프로젝트(동일 anon 키)를 사용.
const url = process.env.NEXT_PUBLIC_MOCK_SUPABASE_URL || SUPABASE_PUBLIC_URL;
const anonKey = process.env.NEXT_PUBLIC_MOCK_SUPABASE_ANON_KEY || SUPABASE_PUBLIC_ANON_KEY;

let cached: ReturnType<typeof createClient> | null | undefined;

function client(): ReturnType<typeof createClient> | null {
  if (cached !== undefined) return cached;
  cached = url && anonKey ? createClient(url, anonKey) : null;
  return cached;
}

export type MockResidentPage = { rows: MockResident[]; total: number };

// DB row(snake_case) → MockResident(UI 형태).
function mapRow(r: Record<string, unknown>): MockResident {
  return {
    id: Number(r.id),
    name: String(r.name ?? ""),
    gender: r.gender === "여" ? "여" : "남",
    birth: String(r.birth_date ?? ""),
    rrn: String(r.rrn_masked ?? ""),
    frn: String(r.frn_masked ?? ""),
    nationality: String(r.nationality ?? ""),
    visa: String(r.visa ?? ""),
    sido: String(r.sido ?? ""),
    sigungu: String(r.sigungu ?? ""),
    registeredAt: String(r.registered_at ?? "")
  };
}

// 한 페이지 조회(필터 + 서버 페이지네이션). 미설정/오류 시 null → 화면이 폴백 처리.
export async function fetchMockResidentsPage(opts: {
  page: number;
  pageSize: number;
  name?: string;
  nationality?: string;
  gender?: string;
  sido?: string;
}): Promise<MockResidentPage | null> {
  const c = client();
  if (!c) return null;

  const from = opts.page * opts.pageSize;
  const to = from + opts.pageSize - 1;

  let q = c.from("mock_residents").select("*", { count: "exact" });
  const name = opts.name?.trim();
  if (name) q = q.ilike("name", `%${name}%`);
  if (opts.nationality) q = q.eq("nationality", opts.nationality);
  if (opts.gender) q = q.eq("gender", opts.gender);
  if (opts.sido) q = q.eq("sido", opts.sido);

  const { data, count, error } = await q.order("id", { ascending: true }).range(from, to);
  if (error || !data) return null;
  return { rows: (data as Record<string, unknown>[]).map(mapRow), total: count ?? 0 };
}
