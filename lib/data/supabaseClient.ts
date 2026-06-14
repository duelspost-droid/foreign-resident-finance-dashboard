import { createClient } from "@supabase/supabase-js";
import type { ForeignResidentRegionMonth, ForeignResidentStatus } from "@/lib/types/foreignResident";
import type { FinanceSegmentAggregate } from "@/lib/types/finance";
import type { ForeignStudentUniversity } from "@/lib/types/university";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
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
