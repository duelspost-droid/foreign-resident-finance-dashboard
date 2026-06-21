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

// 축 2 카테고리 → 분석 페이지 + 소속 데이터셋(수집 소스 id) + 해당 섹션 앵커
type CatItem = { id: string; anchor?: string };
type CatView = { label: string; href: string };
type CatGroup = { label: string; views: CatView[]; icon: typeof Users; desc: string; items: CatItem[] };
const CATEGORIES: CatGroup[] = [
  {
    label: "인구·체류",
    views: [
      { label: "국적 분석", href: "/nationalities" },
      { label: "지역 분석", href: "/regions" },
      { label: "비자 세그먼트", href: "/visa-segments" }
    ],
    icon: Users,
    desc: "국적·체류자격·지역 분포",
    items: [
      { id: "moj_foreign_resident_status_2024" },
      { id: "moj_foreign_stay_data_2024" },
      { id: "moj_immigration_monthly_2024" },
      { id: "mois_foreign_resident_region_file" },
      { id: "kosis_registered_foreigner_by_region" },
      { id: "kosis_registered_foreigner_sigungu_visa" },
      { id: "kosis_foreigner_economic_activity" },
      { id: "seoul_foreigner_population" }
    ]
  },
  {
    label: "경제활동·소득",
    views: [{ label: "경제활동·소득", href: "/economy" }],
    icon: BarChart3,
    desc: "임금·고용·산업·연령·EPS·건강보험·다문화",
    items: [
      { id: "kosis_immigrant_wage_distribution", anchor: "income" },
      { id: "kosis_immigrant_contract_period", anchor: "income" },
      { id: "kosis_eps_introduction_by_country", anchor: "income" },
      { id: "kosis_eps_introduction_by_industry", anchor: "income" },
      { id: "kosis_immigrant_employment_status", anchor: "employment" },
      { id: "kosis_immigrant_employment_by_industry", anchor: "employment" },
      { id: "kosis_immigrant_econ_activity_by_age", anchor: "employment" },
      { id: "nhis_foreigner_coverage_2022", anchor: "health" },
      { id: "nhis_foreigner_premium_2023", anchor: "health" },
      { id: "mogef_multicultural_family_2024", anchor: "welfare" }
    ]
  },
  {
    label: "유학생",
    views: [{ label: "유학생", href: "/universities" }],
    icon: GraduationCap,
    desc: "추이·국적·대학·시도",
    items: [
      { id: "moj_foreign_student_stay_2024" },
      { id: "moe_foreign_student_region" },
      { id: "academyinfo_foreign_student_count" },
      { id: "academyinfo_university_stats" },
      { id: "kosis_foreign_student_nationality_visa" },
      { id: "kosis_kedi_higher_edu_foreign_students" },
      { id: "moe_foreign_student_latest" }
    ]
  },
  {
    label: "소비·금융거래",
    views: [{ label: "소비·금융거래", href: "/consumption" }],
    icon: ShoppingBag,
    desc: "면세점·부동산·본국송금·환율",
    items: [
      { id: "ecos_bop_transfer_income", anchor: "macro" },
      { id: "ecos_bop_transfer_monthly", anchor: "macro" },
      { id: "ecos_exchange_rate_daily", anchor: "macro" },
      { id: "jdc_dutyfree_sales_by_nationality", anchor: "trade" },
      { id: "jeju_foreign_land_acquisition", anchor: "trade" }
    ]
  }
];

// 카탈로그는 소비자용 색인 — 운영 상태(수집 성공/실패/캐시)는 '메타데이터 관리'로 일원화.
// 여기선 '가용성'만: 분석 가능한 건(downloaded·cached) 배지 없이 깔끔하게, 아직 못 쓰는 것만 표시.
const PENDING_BADGE: Record<string, { text: string; cls: string }> = {
  skipped_no_key: { text: "키 대기", cls: "bg-slate-100 text-slate-600" }
};

function AvailabilityBadge({ status }: { status: string }) {
  if (status === "downloaded" || status === "cached") return null;
  const info = PENDING_BADGE[status] ?? { text: "준비중", cls: "bg-slate-100 text-slate-600" };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.cls}`}>{info.text}</span>;
}

export default function CatalogPage() {
  const byId = new Map<string, DataLineageSource>(dataLineage.sources.map((s) => [s.id, s]));
  const updated = dataLineage.generatedAt
    ? new Date(dataLineage.generatedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const cataloged = CATEGORIES.reduce((n, c) => n + c.items.filter((it) => byId.has(it.id)).length, 0);

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="분석 데이터 활용"
        title="데이터 카탈로그"
        description="수집 중인 외국인 데이터셋을 카테고리별로 한눈에 보고, 각 분석 차트로 바로 이동합니다. 각 데이터셋의 행수·갱신주기를 함께 표시합니다."
      />

      {/* 요약 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
          <Database size={13} className="text-teal-600" />
          데이터셋 {cataloged}종
        </span>
        <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
          <RefreshCw size={13} />
          마지막 갱신 {updated}
        </span>
      </div>

      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const items = cat.items
          .map((it) => ({ source: byId.get(it.id), anchor: it.anchor }))
          .filter((x): x is { source: DataLineageSource; anchor: string | undefined } => Boolean(x.source));
        if (items.length === 0) return null;
        return (
          <section key={cat.label}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon size={17} className="text-teal-600" aria-hidden />
                <h2 className="text-sm font-bold text-slate-900">{cat.label}</h2>
                <span className="hidden text-xs text-slate-400 sm:inline">{cat.desc}</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                {cat.views.map((v) => (
                  <Link
                    key={v.href}
                    href={v.href}
                    className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-teal-700 hover:underline"
                  >
                    {v.label} <ArrowRight size={12} aria-hidden />
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ source: s, anchor }) => {
                const target = anchor ? `${cat.views[0].href}#${anchor}` : cat.views[0].href;
                return (
                  <div key={s.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-bold leading-snug text-slate-900">{s.title}</h3>
                      <AvailabilityBadge status={s.status} />
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
                      href={target}
                      className="mt-3 flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
                    >
                      분석하기 <ArrowRight size={12} aria-hidden />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* 파생 분석 안내: 기회 점수는 여러 분류의 합성 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
        <span className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-slate-700">합성</span>
        <span>
          <Link href="/opportunity-scores" className="font-semibold text-teal-700 hover:underline">기회 점수</Link>는
          ‘인구·체류’·‘유학생’ 데이터를 합성한 파생 분석 화면이라 별도 데이터 분류가 없습니다.
        </span>
      </div>

      <p className="text-xs text-slate-500">
        전체 수집 원본·수집 상태·이력 상세는 <Link href="/data-pipeline" className="font-semibold text-teal-700 hover:underline">메타데이터 관리</Link>에서 확인할 수 있습니다.
        모든 데이터는 집계 통계이며 개인식별정보를 포함하지 않습니다.
      </p>
    </div>
  );
}
