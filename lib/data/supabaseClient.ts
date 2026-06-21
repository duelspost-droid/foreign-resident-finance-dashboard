import { createClient } from "@supabase/supabase-js";
import type { ForeignResidentRegionMonth, ForeignResidentStatus } from "@/lib/types/foreignResident";
import type { FinanceSegmentAggregate } from "@/lib/types/finance";
import type { ForeignStudentUniversity } from "@/lib/types/university";
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "./supabaseConfig";

export function createBrowserSupabaseClient() {
  const url = SUPABASE_PUBLIC_URL;
  const anonKey = SUPABASE_PUBLIC_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

export type SourceCandidate = {
  id: number;
  datasetId: string;
  kind: string;
  provider: string | null;
  title: string | null;
  keyword: string | null;
  url: string | null;
  targetTable: string | null;
  status: "pending" | "approved" | "rejected";
  priority: string | null;
  rationale: string | null;
  discoveredAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  notes: string | null;
};

function mapCandidate(row: Record<string, unknown>): SourceCandidate {
  return {
    id: Number(row.id),
    datasetId: String(row.dataset_id),
    kind: String(row.kind),
    provider: (row.provider as string) ?? null,
    title: (row.title as string) ?? null,
    keyword: (row.keyword as string) ?? null,
    url: (row.url as string) ?? null,
    targetTable: (row.target_table as string) ?? null,
    status: (row.status as SourceCandidate["status"]) ?? "pending",
    priority: (row.priority as string) ?? null,
    rationale: (row.rationale as string) ?? null,
    discoveredAt: (row.discovered_at as string) ?? null,
    decidedAt: (row.decided_at as string) ?? null,
    decidedBy: (row.decided_by as string) ?? null,
    notes: (row.notes as string) ?? null,
  };
}

// 후보 목록 조회. Supabase 미연결 시 null 반환(관리자 페이지에서 fallback 처리).
export async function fetchSourceCandidates(): Promise<SourceCandidate[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("source_candidates")
    .select("*")
    .order("status", { ascending: true })
    .order("discovered_at", { ascending: false });

  if (error) {
    console.error("fetchSourceCandidates error:", error.message);
    return null;
  }
  return data.map(mapCandidate);
}

// 관리자 승인/거부/되돌리기 처리. 성공 시 true.
// pending 으로 되돌리면 결정 메타(decided_*)를 비우고 다시 대기 큐로 보낸다.
// target_table·notes 는 명시했을 때만 갱신(되돌리기 시 기존 값 보존).
export async function updateCandidateStatus(
  id: number,
  status: "approved" | "rejected" | "pending",
  options: { targetTable?: string; decidedBy?: string; notes?: string } = {}
): Promise<boolean> {
  const client = createBrowserSupabaseClient();
  if (!client) return false;

  const patch: Record<string, unknown> = { status };
  if (status === "pending") {
    patch.decided_at = null;
    patch.decided_by = null;
  } else {
    patch.decided_at = new Date().toISOString();
    patch.decided_by = options.decidedBy ?? "admin";
  }
  if (options.targetTable !== undefined) patch.target_table = options.targetTable;
  if (options.notes !== undefined) patch.notes = options.notes;

  const { error } = await client.from("source_candidates").update(patch).eq("id", id);

  if (error) {
    console.error("updateCandidateStatus error:", error.message);
    return false;
  }
  return true;
}

// ── 대시보드 반영 설정 (surface_config) ───────────────────────────────────────────
export type SurfaceConfigRow = {
  sourceId: string;
  screen: string | null;
  displayLabel: string | null;
  enabled: boolean;
  targetTable: string | null;
  note: string | null;
  disposition: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

function mapSurface(row: Record<string, unknown>): SurfaceConfigRow {
  return {
    sourceId: String(row.source_id),
    screen: (row.screen as string) ?? null,
    displayLabel: (row.display_label as string) ?? null,
    enabled: row.enabled !== false,
    targetTable: (row.target_table as string) ?? null,
    note: (row.note as string) ?? null,
    disposition: (row.disposition as string) ?? null,
    updatedAt: (row.updated_at as string) ?? null,
    updatedBy: (row.updated_by as string) ?? null,
  };
}

// ── 미연동 소스 트리아지 (surface_config.disposition) ───────────────────────────────
export type SourceDisposition = { disposition: string | null; targetTable: string | null };

// 소스별 트리아지 상태 조회. 미연결/오류 시 null(호출부에서 '미연결' 표시).
export async function fetchSurfaceDispositions(): Promise<Record<string, SourceDisposition> | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("surface_config").select("source_id,disposition,target_table");
  if (error) {
    console.error("fetchSurfaceDispositions error:", error.message);
    return null;
  }
  const map: Record<string, SourceDisposition> = {};
  for (const r of data ?? []) {
    map[String(r.source_id)] = {
      disposition: (r.disposition as string) ?? null,
      targetTable: (r.target_table as string) ?? null,
    };
  }
  return map;
}

// 트리아지 1건 저장(upsert). disposition=null 이면 '미정'으로 되돌림. 성공 시 true.
export async function setSourceDisposition(
  sourceId: string,
  disposition: "planned" | "archived" | "excluded" | null,
  targetTable?: string | null
): Promise<boolean> {
  const client = createBrowserSupabaseClient();
  if (!client) return false;
  const patch: Record<string, unknown> = {
    source_id: sourceId,
    disposition,
    updated_at: new Date().toISOString(),
    updated_by: "admin",
  };
  if (targetTable !== undefined) patch.target_table = targetTable;
  const { error } = await client.from("surface_config").upsert(patch, { onConflict: "source_id" });
  if (error) {
    console.error("setSourceDisposition error:", error.message);
    return false;
  }
  return true;
}

// 반영 설정 전체 조회. 미연결/오류 시 null(호출부에서 하드코딩 기본값으로 폴백).
export async function fetchSurfaceConfig(): Promise<SurfaceConfigRow[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("surface_config").select("*");
  if (error) {
    console.error("fetchSurfaceConfig error:", error.message);
    return null;
  }
  return (data ?? []).map(mapSurface);
}

// 반영 설정 1건 저장(upsert). 성공 시 true.
export async function upsertSurfaceConfig(row: {
  sourceId: string;
  screen?: string | null;
  displayLabel?: string | null;
  enabled?: boolean;
  targetTable?: string | null;
  note?: string | null;
  updatedBy?: string;
}): Promise<boolean> {
  const client = createBrowserSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("surface_config").upsert(
    {
      source_id: row.sourceId,
      screen: row.screen ?? null,
      display_label: row.displayLabel ?? null,
      enabled: row.enabled ?? true,
      target_table: row.targetTable ?? null,
      note: row.note ?? null,
      updated_at: new Date().toISOString(),
      updated_by: row.updatedBy ?? "admin",
    },
    { onConflict: "source_id" }
  );
  if (error) {
    console.error("upsertSurfaceConfig error:", error.message);
    return false;
  }
  return true;
}

export type RegionFilter = {
  baseMonth?: string;
  sido?: string;
  nationality?: string;
};

export type StatusFilter = {
  baseYear?: number;
  nationality?: string;
  segmentType?: string;
};

export type FinanceFilter = {
  baseMonth?: string;
  sido?: string;
  nationality?: string;
};

export type UniversityFilter = {
  baseYear?: number;
  sido?: string;
};

export async function fetchRegionData(
  filter: RegionFilter = {}
): Promise<ForeignResidentRegionMonth[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;

  let query = client
    .from("foreign_resident_region_month")
    .select("*")
    .order("resident_count", { ascending: false });

  if (filter.baseMonth) query = query.eq("base_month", filter.baseMonth);
  if (filter.sido) query = query.eq("sido", filter.sido);
  if (filter.nationality) query = query.eq("nationality", filter.nationality);

  const { data, error } = await query.limit(500);
  if (error) {
    console.error("fetchRegionData error:", error.message);
    return null;
  }

  return data.map((row) => ({
    id: String(row.id),
    baseMonth: row.base_month,
    sido: row.sido,
    sigungu: row.sigungu,
    nationality: row.nationality,
    gender: row.gender ?? undefined,
    residentCount: row.resident_count,
    longTermCount: row.long_term_count ?? undefined,
    shortTermCount: row.short_term_count ?? undefined,
    yoyChangeRate: row.yoy_change_rate ?? undefined,
    momChangeRate: row.mom_change_rate ?? undefined,
    sourceName: row.source_name ?? undefined,
  }));
}

export async function fetchForeignResidentStatus(
  filter: StatusFilter = {}
): Promise<ForeignResidentStatus[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;

  let query = client
    .from("foreign_resident_status")
    .select("*")
    .order("resident_count", { ascending: false });

  if (filter.baseYear) query = query.eq("base_year", filter.baseYear);
  if (filter.nationality) query = query.eq("nationality", filter.nationality);
  if (filter.segmentType) query = query.eq("segment_type", filter.segmentType);

  const { data, error } = await query.limit(200);
  if (error) {
    console.error("fetchForeignResidentStatus error:", error.message);
    return null;
  }

  return data.map((row) => ({
    id: String(row.id),
    baseYear: row.base_year ?? undefined,
    baseMonth: row.base_month ?? undefined,
    nationality: row.nationality,
    visaCode: row.visa_code ?? undefined,
    visaName: row.visa_name ?? undefined,
    segmentType: row.segment_type,
    residentCount: row.resident_count,
    financialNeedTags: row.financial_need_tags ?? [],
    sourceName: row.source_name ?? undefined,
  }));
}

export async function fetchFinanceSegments(
  filter: FinanceFilter = {}
): Promise<FinanceSegmentAggregate[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;

  let query = client
    .from("finance_segment_aggregate")
    .select("*")
    .order("base_month", { ascending: false });

  if (filter.baseMonth) query = query.eq("base_month", filter.baseMonth);
  if (filter.sido) query = query.eq("sido", filter.sido);
  if (filter.nationality) query = query.eq("nationality", filter.nationality);

  const { data, error } = await query.limit(200);
  if (error) {
    console.error("fetchFinanceSegments error:", error.message);
    return null;
  }

  return data.map((row) => ({
    id: String(row.id),
    baseMonth: row.base_month,
    sido: row.sido ?? undefined,
    sigungu: row.sigungu ?? undefined,
    nationality: row.nationality ?? undefined,
    segmentType: row.segment_type ?? undefined,
    accountOpenCount: row.account_open_count ?? undefined,
    debitCardIssueCount: row.debit_card_issue_count ?? undefined,
    remittanceCount: row.remittance_count ?? undefined,
    remittanceAmount: row.remittance_amount ?? undefined,
    payrollAccountCount: row.payroll_account_count ?? undefined,
    mobileForeignLanguageUserCount: row.mobile_foreign_language_user_count ?? undefined,
    averageBalance: row.average_balance ?? undefined,
    delinquencyRate: row.delinquency_rate ?? undefined,
    sourceName: row.source_name ?? undefined,
  }));
}

export async function fetchUniversityData(
  filter: UniversityFilter = {}
): Promise<ForeignStudentUniversity[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;

  let query = client
    .from("foreign_student_university")
    .select("*")
    .order("student_count", { ascending: false });

  if (filter.baseYear) query = query.eq("base_year", filter.baseYear);
  if (filter.sido) query = query.eq("sido", filter.sido);

  const { data, error } = await query.limit(300);
  if (error) {
    console.error("fetchUniversityData error:", error.message);
    return null;
  }

  return data.map((row) => ({
    id: String(row.id),
    baseYear: row.base_year,
    universityName: row.university_name,
    campusName: row.campus_name ?? undefined,
    universityType: row.university_type ?? undefined,
    sido: row.sido ?? undefined,
    sigungu: row.sigungu ?? undefined,
    address: row.address ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    nationality: row.nationality ?? undefined,
    degreeCourse: row.degree_course ?? undefined,
    studentCount: row.student_count,
    sourceName: row.source_name ?? undefined,
  }));
}

// ── AI 인사이트 질의 이력 (ai_insight_chat) ──────────────────────────────────────
export type ChatRow = {
  id: number;
  session_id: string;
  question: string;
  answer: string;
  source: string;
  pages: string[];
  created_at: string;
};

// 이력 1건 삽입(best-effort). Supabase 미연결/테이블 없음/오류 시 false.
export async function insertChatEntry(e: {
  sessionId: string;
  question: string;
  answer: string;
  source: string;
  pages: string[];
}): Promise<boolean> {
  const client = createBrowserSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("ai_insight_chat").insert({
    session_id: e.sessionId,
    question: e.question,
    answer: e.answer,
    source: e.source,
    pages: e.pages
  });
  return !error;
}

// 세션 이력 조회. 미연결/오류 시 null(호출부에서 localStorage 폴백).
export async function fetchChatHistory(sessionId: string, limit = 100): Promise<ChatRow[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("ai_insight_chat")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return null;
  return (data ?? []) as ChatRow[];
}

// 세션 이력 전체 삭제(best-effort).
export async function deleteChatHistory(sessionId: string): Promise<boolean> {
  const client = createBrowserSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("ai_insight_chat").delete().eq("session_id", sessionId);
  return !error;
}

// ── 사용자 제안 접수 + 관리자 답변 (feature_requests) ────────────────────────────────
export type FeatureRequestRow = {
  id: number;
  session_id: string;
  category: string; // feature | data
  title: string;
  body: string;
  page: string | null;
  status: string; // received | reviewing | answered | rejected
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
};

// 제안 1건 제출(best-effort). 미연결/오류 시 false.
export async function submitFeatureRequest(e: {
  sessionId: string;
  category: string;
  title: string;
  body: string;
  page: string;
}): Promise<boolean> {
  const client = createBrowserSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("feature_requests").insert({
    session_id: e.sessionId,
    category: e.category,
    title: e.title,
    body: e.body,
    page: e.page
  });
  return !error;
}

// 전체 제안 목록(관리자 콘솔 전용 — 모든 컬럼). 미연결/오류 시 null.
export async function fetchAllFeatureRequests(limit = 500): Promise<FeatureRequestRow[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("feature_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return null;
  return (data ?? []) as FeatureRequestRow[];
}

// 공개 '과거 제안 이력'용 — 표시에 필요한 컬럼만 반환(session_id·page 등 미반환, 데이터 최소화).
// RLS는 anon 전체 SELECT를 허용하지만, 익명 응답에 식별·추적 소지 값이 섞이지 않도록 조회 단계에서 좁힌다.
export async function fetchPublicFeatureRequests(limit = 300): Promise<FeatureRequestRow[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("feature_requests")
    .select("id,category,title,body,status,admin_response,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return null;
  return (data ?? []) as FeatureRequestRow[];
}

// 관리자 답변/상태 처리는 admin Edge Function(토큰 검증)로 이전 → lib/data/adminApi.ts 의 adminRespond.

// ── 익명 접속 통계 (page_views) ──────────────────────────────────────────────────
export type PageViewRow = {
  id: number;
  session_id: string;
  path: string;
  referrer_host: string | null;
  created_at: string;
};

// 페이지뷰 1건 기록(best-effort, fire-and-forget).
export async function logPageView(e: {
  sessionId: string;
  path: string;
  referrerHost: string | null;
}): Promise<boolean> {
  const client = createBrowserSupabaseClient();
  if (!client) return false;
  const { error } = await client.from("page_views").insert({
    session_id: e.sessionId,
    path: e.path,
    referrer_host: e.referrerHost
  });
  return !error;
}

// 접속 통계 원시 로그(관리자 집계용). 미연결/오류 시 null.
export async function fetchPageViews(limit = 3000): Promise<PageViewRow[] | null> {
  const client = createBrowserSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("page_views")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return null;
  return (data ?? []) as PageViewRow[];
}
