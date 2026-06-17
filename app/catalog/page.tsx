import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  ExternalLink,
  GraduationCap,
  RefreshCw,
  ShoppingBag,
  Users
} from "lucide-react";
import { dataLineage, type DataLineageSource } from "@/lib/data/generated/dataLineage";
import { PageHero } from "@/components/ui/PageHero";

// 축 2 카테고리 → 분석 페이지 + 소속 데이터셋(수집 소스 id)
const CATEGORIES = [
  {
    label: "인구·체류",
    href: "/nationalities",
    icon: Users,
    desc: "국적·체류자격·지역 분포",
    ids: [
      "moj_foreign_resident_status_2024",
      "moj_foreign_stay_data_2024",
      "moj_immigration_monthly_2024",
      "mois_foreign_resident_region_file",
      "kosis_registered_foreigner_by_region",
      "kosis_registered_foreigner_sigungu_visa",
      "kosis_foreigner_economic_activity",
      "seoul_foreigner_population"
    ]
  },
  {
    label: "경제활동·소득",
    href: "/economy",
    icon: BarChart3,
    desc: "임금·고용·산업·연령·EPS·건강보험·다문화",
    ids: [
      "kosis_immigrant_wage_distribution",
      "kosis_immigrant_contract_period",
      "kosis_immigrant_employment_status",
      "kosis_immigrant_employment_by_industry",
      "kosis_immigrant_econ_activity_by_age",
      "kosis_eps_introduction_by_country",
      "kosis_eps_introduction_by_industry",
      "nhis_foreigner_coverage_2022",
      "nhis_foreigner_premium_2023",
      "mogef_multicultural_family_2024"
    ]
  },
  {
    label: "유학생",
    href: "/universities",
    icon: GraduationCap,
    desc: "추이·국적·대학·시도",
    ids: [
      "moj_foreign_student_stay_2024",
      "moe_foreign_student_region",
      "academyinfo_foreign_student_count",
      "academyinfo_university_stats",
      "kosis_foreign_student_nationality_visa",
      "kosis_kedi_higher_edu_foreign_students",
      "moe_foreign_student_latest"
    ]
  },
  {
    label: "소비·금융거래",
    href: "/consumption",
    icon: ShoppingBag,
    desc: "면세점·부동산·본국송금·환율",
    ids: [
      "ecos_bop_transfer_income",
      "ecos_bop_transfer_monthly",
      "ecos_exchange_rate_daily",
      "jdc_dutyfree_sales_by_nationality",
      "jeju_foreign_land_acquisition"
    ]
  }
];

const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  downloaded: { text: "수집 성공", cls: "bg-teal-100 text-teal-800" },
  cached: { text: "캐시 유지", cls: "bg-amber-100 text-amber-800" },
  skipped_no_key: { text: "키 대기", cls: "bg-slate-100 text-slate-600" }
};

function StatusBadge({ status }: { status: string }) {
  const info = STATUS_BADGE[status] ?? { text: "대기", cls: "bg-slate-100 text-slate-600" };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.cls}`}>{info.text}</span>;
}

export default function CatalogPage() {
  const byId = new Map<string, DataLineageSource>(dataLineage.sources.map((s) => [s.id, s]));
  const { totals } = dataLineage;
  const updated = dataLineage.generatedAt
    ? new Date(dataLineage.generatedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const cataloged = CATEGORIES.reduce((n, c) => n + c.ids.filter((id) => byId.has(id)).length, 0);

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="분석 데이터 활용"
        title="분석 데이터 카탈로그"
        description="수집 중인 외국인 데이터셋을 카테고리별로 한눈에 보고, 각 분석 페이지로 이동합니다. 수집 상태·행수는 매일 자동 갱신됩니다."
      />

      {/* 요약 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
          <Database size={13} className="text-teal-600" />
          데이터셋 {cataloged}종
        </span>
        <span className="flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-700">
          수집 성공 {totals.downloaded} · 캐시 {totals.cached} · 실패 {totals.failed}
        </span>
        <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
          <RefreshCw size={13} />
          마지막 갱신 {updated}
        </span>
      </div>

      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const items = cat.ids.map((id) => byId.get(id)).filter((s): s is DataLineageSource => Boolean(s));
        if (items.length === 0) return null;
        return (
          <section key={cat.label}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon size={17} className="text-teal-600" aria-hidden />
                <h2 className="text-sm font-bold text-slate-900">{cat.label}</h2>
                <span className="hidden text-xs text-slate-400 sm:inline">{cat.desc}</span>
              </div>
              <Link
                href={cat.href}
                className="flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
              >
                전체 분석 <ArrowRight size={13} aria-hidden />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <div key={s.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[13px] font-bold leading-snug text-slate-900">{s.title}</h3>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{s.provider}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      {s.rowCount != null ? `${s.rowCount.toLocaleString()}행` : "—"}
                      {s.updateCycle ? ` · ${s.updateCycle}` : ""}
                    </span>
                    {s.sourceUrl && (
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-teal-600"
                      >
                        원본 <ExternalLink size={11} aria-hidden />
                      </a>
                    )}
                  </div>
                  <Link
                    href={cat.href}
                    className="mt-3 flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    분석하기 <ArrowRight size={12} aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-slate-500">
        수집 출처·이력 상세는 <Link href="/data-pipeline" className="font-semibold text-teal-700 hover:underline">데이터 관리</Link>에서 확인할 수 있습니다.
        모든 데이터는 집계 통계이며 개인식별정보를 포함하지 않습니다.
      </p>
    </div>
  );
}
