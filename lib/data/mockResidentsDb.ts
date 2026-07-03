// 가상 외국인정보(mock_residents) '전용' Postgres 읽기 레이어.
//
// ⚠️ 이 대시보드의 '프로덕션 분석 Supabase'가 아니라, 가상 데이터 '전용'으로 분리된
// 별도 Supabase 프로젝트를 바라본다(집계 전용 원칙 유지). 환경변수 미설정 시 null을
// 반환 → 화면은 클라이언트 생성 모드로 폴백한다(배포에 영향 없음).
//
// 정적 export(GitHub Pages)라 런타임 서버가 없어 클라이언트 supabase-js + anon 키로만
// 접근한다. 큰 표라서 서버 페이지네이션(.range) + 정확 카운트(count:'exact')를 쓴다.

import { createClient } from "@supabase/supabase-js";
import type { MockResident } from "./mockResidents";

const MOCK_DB_URL = process.env.NEXT_PUBLIC_MOCK_SUPABASE_URL;
const MOCK_DB_ANON_KEY = process.env.NEXT_PUBLIC_MOCK_SUPABASE_ANON_KEY;

let cached: ReturnType<typeof createClient> | null | undefined;

function client(): ReturnType<typeof createClient> | null {
  if (cached !== undefined) return cached;
  cached = MOCK_DB_URL && MOCK_DB_ANON_KEY ? createClient(MOCK_DB_URL, MOCK_DB_ANON_KEY) : null;
  return cached;
}

// 전용 DB가 설정돼 있으면 true → 화면이 DB 모드로 동작.
export function isMockDbConfigured(): boolean {
  return Boolean(MOCK_DB_URL && MOCK_DB_ANON_KEY);
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
