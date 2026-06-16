import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Banknote,
  GraduationCap,
  MapPin,
  Users
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { InsightCard } from "@/components/cards/InsightCard";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { VisaDonutChart } from "@/components/charts/VisaDonutChart";
import { ScoreRadarChart } from "@/components/charts/ScoreRadarChart";
import { RegionMap } from "@/components/charts/RegionMap";
import {
  econActivityData,
  hasEconActivity,
  hasHealthInsurance,
  hasMulticulturalFamily,
  hasNationalityByAge,
  hasRealNationalityData,
  hasRealStudentData,
  hasRealUniversityData,
  hasRealVisaData,
  healthInsuranceData,
  kpiSummary,
  multiculturalFamilyData,
  multiculturalFamilySummary,
  nationalityAgeTotals,
  nationalityDistributionData,
  sampleOpportunityRows,
  sampleRegionInsights,
  stayVisaTypes,
  universitySummary,
  visaDistributionData
} from "@/lib/data/mockData";
import { realDataSummary } from "@/lib/data/generated/realData";
import { formatNumber } from "@/lib/utils/format";

// ── 색상 헬퍼 ────────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 72) return "#0f766e";
  if (score >= 55) return "#3157a4";
  if (score >= 40) return "#b45309";
  return "#be123c";
}

const SEG_COLORS: Record<string, string> = {
  "비전문취업 근로자": "#0f766e",
  "재외동포": "#3157a4",
  "유학생": "#b45309",
  "결혼이민": "#be123c",
  "어학연수생": "#7c3aed",
  "전문인력": "#0369a1",
  "단기체류": "#64748b",
  "기타": "#94a3b8"
};

const DONUT_COLORS = ["#0f766e", "#3157a4", "#b45309", "#be123c", "#64748b", "#7c3aed"];

// ── 금융 상품 수요 히트맵 ──────────────────────────────────────────────────────────
const PRODUCTS = ["급여계좌", "본국송금", "체크카드", "신용카드", "소액저축", "보험·연금"];
const DEMAND: Record<string, number[]> = {
  "비전문취업 근로자": [95, 90, 68, 28, 72, 45],
  "유학생":            [52, 62, 92, 44, 60, 18],
  "재외동포":          [72, 52, 78, 84, 62, 70],
  "전문인력":          [82, 36, 66, 92, 50, 80],
  "결혼이민":          [74, 58, 72, 56, 66, 86],
  "단기체류":          [8,  28, 52, 16, 6,  4],
};

function cellStyle(v: number): React.CSSProperties {
  if (v >= 80) return { background: "#0f766e", color: "#fff", fontWeight: 700 };
  if (v >= 60) return { background: "#5eada4", color: "#fff", fontWeight: 600 };
  if (v >= 40) return { background: "#cce7e3", color: "#0f4c41" };
  if (v >= 20) return { background: "#eef5f4", color: "#64748b" };
  return { background: "#f8fafc", color: "#cbd5e1" };
}

export default function DashboardPage() {
  const freshDate = realDataSummary.generatedAt.slice(0, 10);
  const totalRows = realDataSummary.statusRowCount + realDataSummary.regionRowCount;
  const avg = kpiSummary.averageOpportunityScore;
  const loadedDatasets = [
    hasRealNationalityData, hasRealVisaData, hasRealStudentData, hasRealUniversityData,
    hasNationalityByAge, hasHealthInsurance, hasMulticulturalFamily, hasEconActivity
  ].filter(Boolean).length;

  const kpis = [
    {
      label: "총 체류외국인",
      display: formatNumber(kpiSummary.totalResidents > 0 ? kpiSummary.totalResidents : 2_459_883),
      unit: "명",
      trend: "+4.2%",
      icon: Users,
      color: "#0f766e",
      sub: kpiSummary.totalResidents > 0 ? "법무부 실데이터 2024" : "법무부 체류통계"
    },
    {
      label: "등록외국인",
      display: formatNumber(kpiSummary.registeredResidents > 0 ? kpiSummary.registeredResidents : 1_320_540),
      unit: "명",
      trend: "+3.8%",
      icon: Banknote,
      color: "#3157a4",
      sub: "장기체류 · 금융 주고객"
    },
    {
      label: "외국인 유학생",
      display: formatNumber(kpiSummary.foreignStudents > 0 ? kpiSummary.foreignStudents : 173_490),
      unit: "명",
      trend: "+12.3%",
      icon: GraduationCap,
      color: "#b45309",
      sub: "D-2 / D-4 체류"
    },
    {
      label: "평균 금융기회점수",
      display: avg.toFixed(1),
      unit: "/ 100",
      trend: `${sampleOpportunityRows.length}개 지역`,
      icon: BarChart3,
      color: "#be123c",
      sub: "복합 기회지수"
    }
  ];

  return (
    <div className="space-y-6 pb-14">

      <PageHero
        kicker="외국인 금융 인사이트"
        title="외국인 금융 시장 대시보드"
        description="공개 통계와 금융 집계 데이터를 지역·국적·체류자격·대학 단위로 시각화한 분석 화면입니다."
      />

      {/* ── 데이터 신선도 배너 ── */}
      <div
        className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-4 py-2.5 text-xs"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#22c55e" }} />
        <span>수집 기준일 <strong>{freshDate}</strong></span>
        <span className="text-green-300">·</span>
        <span>누적 {totalRows.toLocaleString()}행</span>
        <span className="text-green-300">·</span>
        <span>실데이터셋 {loadedDatasets}/8 적재</span>
        <span className="text-green-300">·</span>
        <span>매일 01:00 KST 자동 갱신</span>
      </div>

      {/* ── KPI 스트립 ── */}
      <section className="metric-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="surface relative flex flex-col gap-3 overflow-hidden p-5">
              <span
                className="absolute right-0 top-0 h-full w-1"
                style={{ background: kpi.color }}
              />
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-muted">{kpi.label}</span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: kpi.color }}
                >
                  <Icon aria-hidden size={18} />
                </span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="text-[2.1rem] font-black leading-none text-ink">{kpi.display}</span>
                <span className="mb-0.5 text-sm text-muted">{kpi.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: "#059669" }}>
                  <ArrowUpRight size={13} />{kpi.trend} YoY
                </span>
                <span className="text-[10px] text-muted">{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── 시각화 히어로: 지역 지도 + 체류자격 도넛 ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">

        {/* 지역별 기회 버블 지도 */}
        <div className="surface overflow-hidden">
          <div className="surface-header pb-1">
            <div>
              <h3 className="surface-title flex items-center gap-1.5">
                <MapPin size={16} style={{ color: "#0f766e" }} /> 지역별 금융 기회 지도
              </h3>
              <p className="surface-subtitle">거품 크기 = 외국인 규모 · 색상 = 기회 점수</p>
            </div>
            <Link href="/regions" className="text-xs font-semibold" style={{ color: "#0f766e" }}>
              지역 분석 →
            </Link>
          </div>
          <div className="flex items-center justify-center px-2 pb-2">
            <RegionMap />
          </div>
          {/* 색상 범례 */}
          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 py-3 text-xs text-muted">
            {[
              { c: "#0f766e", l: "72+ 매우 높음" },
              { c: "#3157a4", l: "55–71 높음" },
              { c: "#b45309", l: "40–54 보통" },
              { c: "#be123c", l: "~39 낮음" }
            ].map((x) => (
              <span key={x.l} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: x.c }} />{x.l}
              </span>
            ))}
          </div>
        </div>

        {/* 체류자격 도넛 + 순위 */}
        <div className="flex flex-col gap-5">
          <div className="surface flex flex-col">
            <div className="surface-header pb-0">
              <div>
                <h3 className="surface-title">체류자격 세그먼트</h3>
                <p className="surface-subtitle">{hasRealVisaData ? "법무부 실데이터" : "표본 기준"} · 비중 분포</p>
              </div>
            </div>
            <div style={{ height: 200 }}>
              <VisaDonutChart />
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-4 pt-1">
              {visaDistributionData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="truncate text-slate-600">{d.name}</span>
                  <span className="ml-auto font-bold text-ink">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 기회 점수 TOP 3 미니 */}
          <div className="surface p-4">
            <h3 className="surface-title mb-3 px-1 text-sm">기회 점수 TOP {Math.min(3, sampleOpportunityRows.length)}</h3>
            <div className="space-y-2.5">
              {sampleOpportunityRows.slice(0, 3).map((row) => (
                <div key={row.id} className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ background: scoreColor(row.overallOpportunityScore) }}
                  >
                    {row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="truncate text-sm font-bold text-ink">{row.sido}</span>
                      <span className="truncate text-[11px] text-muted">{row.sigungu}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#e2e8f0" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, row.overallOpportunityScore)}%`, background: scoreColor(row.overallOpportunityScore) }} />
                    </div>
                  </div>
                  <span className="shrink-0 text-lg font-black" style={{ color: scoreColor(row.overallOpportunityScore) }}>
                    {row.overallOpportunityScore.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 국적별 분포 + 지역 역량 레이더 ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* 국적별 분포 막대 차트 */}
        <div className="surface flex flex-col">
          <div className="surface-header pb-0">
            <div>
              <h3 className="surface-title">국적별 분포 TOP {Math.min(10, nationalityDistributionData.length)}</h3>
              <p className="surface-subtitle">{hasRealNationalityData ? "법무부 국적별 현황 2024" : "표본 지역 기준"}</p>
            </div>
          </div>
          <div style={{ height: 340 }} className="px-2 pb-3 pt-2">
            <NationalityBarChart data={nationalityDistributionData.slice(0, 10)} />
          </div>
        </div>

        {/* 지역 역량 레이더 */}
        <div className="surface flex flex-col">
          <div className="surface-header pb-0">
            <div>
              <h3 className="surface-title">지역 금융 역량 비교</h3>
              <p className="surface-subtitle">송금 · 유학생 · 급여계좌 · 다국어 5개 축 (안산 / 구로 / 동대문)</p>
            </div>
          </div>
          <div style={{ height: 340 }} className="px-2 pb-3 pt-2">
            <ScoreRadarChart />
          </div>
        </div>
      </section>

      {/* ── 월별 추세 라인차트 (full width) ── */}
      <section className="surface">
        <div className="surface-header pb-0">
          <div>
            <h3 className="surface-title">주요 국적별 월별 체류 추세</h3>
            <p className="surface-subtitle">최근 6개월 · 중국 / 우즈베키스탄 / 베트남 / 몽골</p>
          </div>
          <div className="hidden gap-3 text-xs sm:flex">
            {["중국", "우즈베키스탄", "베트남", "몽골"].map((n, i) => (
              <span key={n} className="flex items-center gap-1">
                <span className="h-2 w-4 rounded-sm" style={{ background: ["#0f766e", "#3157a4", "#b45309", "#be123c"][i] }} />
                <span className="text-muted">{n}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="chart-box" style={{ height: 300 }}>
          <TrendLineChart />
        </div>
      </section>

      {/* ── 체류자격별 실인원 (실데이터) ── */}
      {hasRealVisaData && stayVisaTypes.length > 0 && (
        <section className="surface">
          <div className="surface-header pb-3">
            <div>
              <h3 className="surface-title">체류자격별 인원 (실데이터)</h3>
              <p className="surface-subtitle">법무부 외국인체류데이터 2024 · 비자타입 상위 12 · 세그먼트 색상</p>
            </div>
            <Link href="/visa-segments" className="text-xs font-semibold" style={{ color: "#0f766e" }}>
              세그먼트 분석 →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2.5 p-4 pt-2 md:grid-cols-2">
            {stayVisaTypes.slice(0, 12).map((v, i) => {
              const max = stayVisaTypes[0]?.count ?? 1;
              const pct = Math.max(3, Math.round((v.count / max) * 100));
              const color = SEG_COLORS[v.segment] ?? "#94a3b8";
              return (
                <div key={v.visaCode} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 text-right text-[11px] font-bold text-muted">{i + 1}</span>
                  <span className="w-12 shrink-0 font-mono text-[11px] font-bold" style={{ color }}>{v.visaCode}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-ink">{v.visaName}</span>
                      <span className="shrink-0 font-mono text-muted">{formatNumber(v.count)}명</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 추가 실데이터 미니패널 (적재 시 자동 표시) ── */}
      {(hasNationalityByAge || hasHealthInsurance || hasMulticulturalFamily || hasEconActivity) && (
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {hasNationalityByAge && (
            <Link href="/nationalities" className="surface surface-hover p-5">
              <h3 className="surface-title mb-1">국적별 연령구조</h3>
              <p className="surface-subtitle mb-3">행안부 외국인주민 · 상위 국적 연령대</p>
              <div className="space-y-2">
                {nationalityAgeTotals.slice(0, 5).map((n) => {
                  const max = nationalityAgeTotals[0]?.total ?? 1;
                  return (
                    <div key={n.nationality} className="flex items-center gap-2 text-xs">
                      <span className="w-20 shrink-0 truncate text-ink">{n.nationality}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.round((n.total / max) * 100)}%`, background: "#0f766e" }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-muted">{formatNumber(n.total)}</span>
                    </div>
                  );
                })}
              </div>
            </Link>
          )}
          {hasHealthInsurance && (
            <Link href="/financial-insights" className="surface surface-hover p-5">
              <h3 className="surface-title mb-1">건강보험 적용인구 (소득 대리지표)</h3>
              <p className="surface-subtitle mb-3">건보공단 · 지역별 가입 상위 5</p>
              <div className="space-y-2">
                {[...healthInsuranceData].sort((a, b) => b.total - a.total).slice(0, 5).map((h) => {
                  const max = [...healthInsuranceData].sort((a, b) => b.total - a.total)[0]?.total ?? 1;
                  return (
                    <div key={h.region} className="flex items-center gap-2 text-xs">
                      <span className="w-20 shrink-0 truncate text-ink">{h.region}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.round((h.total / max) * 100)}%`, background: "#3157a4" }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-muted">{formatNumber(h.total)}</span>
                    </div>
                  );
                })}
              </div>
            </Link>
          )}
          {hasMulticulturalFamily && (
            <Link href="/financial-insights" className="surface surface-hover p-5">
              <h3 className="surface-title mb-1">다문화가족 현황</h3>
              <p className="surface-subtitle mb-3">여가부 · 총 {formatNumber(multiculturalFamilySummary.totalCount)}명 · 지역별 상위 5</p>
              <div className="space-y-2">
                {[...multiculturalFamilyData].sort((a, b) => b.total - a.total).slice(0, 5).map((m, i) => {
                  const max = [...multiculturalFamilyData].sort((a, b) => b.total - a.total)[0]?.total ?? 1;
                  return (
                    <div key={`${m.region}-${i}`} className="flex items-center gap-2 text-xs">
                      <span className="w-24 shrink-0 truncate text-ink">{m.region}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.round((m.total / max) * 100)}%`, background: "#be123c" }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-muted">{formatNumber(m.total)}</span>
                    </div>
                  );
                })}
              </div>
            </Link>
          )}
          {hasEconActivity && (
            <Link href="/financial-insights" className="surface surface-hover p-5">
              <h3 className="surface-title mb-1">외국인 경제활동인구</h3>
              <p className="surface-subtitle mb-3">통계청 · 체류자격별 취업·경제활동</p>
              <div className="space-y-2">
                {(() => {
                  const latest = [...econActivityData].sort((a, b) => b.period.localeCompare(a.period))[0]?.period ?? "";
                  const rows = econActivityData.filter((r) => r.period === latest).sort((a, b) => b.value - a.value).slice(0, 5);
                  const max = rows[0]?.value ?? 1;
                  return rows.map((r, i) => (
                    <div key={`${r.category}-${i}`} className="flex items-center gap-2 text-xs">
                      <span className="w-24 shrink-0 truncate text-ink">{r.category}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.round((r.value / max) * 100)}%`, background: "#b45309" }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-muted">{formatNumber(r.value)}</span>
                    </div>
                  ));
                })()}
              </div>
            </Link>
          )}
        </section>
      )}

      {/* ── 수요 히트맵 + 인사이트 ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">

        {/* 히트맵 */}
        <div className="surface">
          <div className="surface-header pb-3">
            <div>
              <h3 className="surface-title">체류자격 × 금융상품 수요 히트맵</h3>
              <p className="surface-subtitle">수요 강도 0–100 · 짙을수록 우선순위 높음</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-muted">세그먼트</th>
                  {PRODUCTS.map((p) => (
                    <th key={p} className="px-2 py-2.5 text-center text-[11px] font-bold text-muted">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(DEMAND).map(([seg, vals]) => (
                  <tr key={seg} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="whitespace-nowrap px-4 py-2 text-xs font-semibold text-ink">{seg}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="px-2 py-2.5 text-center text-xs" style={cellStyle(v)}>
                        {v >= 20 ? v : "·"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-xs text-muted" style={{ borderTop: "1px solid #e2e8f0" }}>
            {[
              { bg: "#0f766e", color: "#fff", label: "80+" },
              { bg: "#5eada4", color: "#fff", label: "60–79" },
              { bg: "#cce7e3", color: "#0f4c41", label: "40–59" },
              { bg: "#eef5f4", color: "#64748b", label: "20–39" }
            ].map(({ bg, color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="h-3.5 w-5 rounded-sm border border-line" style={{ background: bg }} />
                <span style={{ color }}>{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 인사이트 카드 */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#697586" }}>
            자동 생성 지역 인사이트
          </p>
          {sampleRegionInsights.slice(0, 3).map((insight) => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              body={insight.body}
              score={insight.score}
            />
          ))}
          <p className="text-xs text-muted">* 수집 데이터 기반 매일 자동 생성됩니다.</p>
        </div>
      </section>

    </div>
  );
}
