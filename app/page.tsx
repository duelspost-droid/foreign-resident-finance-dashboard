import { ArrowUpRight, BarChart2, GraduationCap, MapPin, TrendingUp, Users } from "lucide-react";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { VisaDonutChart } from "@/components/charts/VisaDonutChart";
import { RankingTable } from "@/components/charts/RankingTable";
import {
  kpiSummary,
  nationalityDistributionData,
  sampleOpportunityRows,
  sampleRegionInsights,
  visaDistributionData
} from "@/lib/data/mockData";
import { formatNumber, formatPercent, formatScore } from "@/lib/utils/format";

const VISA_COLORS = [
  "bg-teal-500",
  "bg-blue-500",
  "bg-amber-400",
  "bg-rose-500",
  "bg-slate-400",
  "bg-violet-500"
];

function ScorePill({ score }: { score: number }) {
  let cls = "bg-slate-100 text-slate-600";
  if (score >= 80) cls = "bg-teal-100 text-teal-800";
  else if (score >= 60) cls = "bg-blue-100 text-blue-800";
  else if (score >= 40) cls = "bg-amber-100 text-amber-700";
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>
      {formatScore(score)}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  let barCls = "bg-slate-300";
  if (score >= 80) barCls = "bg-teal-500";
  else if (score >= 60) barCls = "bg-blue-500";
  else if (score >= 40) barCls = "bg-amber-400";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${barCls}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="border-b border-slate-100 px-4 py-3">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const maxNatShare = Math.max(...nationalityDistributionData.map((d) => d.share));

  const kpis = [
    {
      label: "총 체류외국인",
      value: "2,459,883명",
      delta: "+5.2% YoY",
      sub: "법무부 2024.12",
      icon: <Users size={16} />,
      up: true
    },
    {
      label: "등록외국인",
      value: "1,277,945명",
      delta: "+4.1% YoY",
      sub: "장기체류(90일+)",
      icon: <MapPin size={16} />,
      up: true
    },
    {
      label: "외국인 유학생",
      value: "185,010명",
      delta: "+8.7% YoY",
      sub: "교육부 2024",
      icon: <GraduationCap size={16} />,
      up: true
    },
    {
      label: "평균 기회 점수",
      value: `${formatScore(kpiSummary.averageOpportunityScore)}점`,
      delta: "0~100 정규화",
      sub: `거점 ${sampleOpportunityRows.length}개 기준`,
      icon: <TrendingUp size={16} />,
      up: null
    }
  ];

  return (
    <div className="space-y-5">
      {/* ── KPI 스트립 ── */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-white">
        <div className="flex items-center gap-2 border-b border-slate-700/60 px-5 py-2.5">
          <BarChart2 size={14} className="text-teal-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            핵심 지표 · 2024 법무부 / 교육부 집계 기준
          </span>
          <span className="ml-auto rounded bg-teal-900/50 px-2 py-0.5 text-xs text-teal-300">
            집계 통계 (개인정보 無)
          </span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-700/60 sm:grid-cols-4">
          {kpis.map(({ label, value, delta, sub, icon, up }) => (
            <div key={label} className="flex flex-col gap-1 px-5 py-4">
              <div className="flex items-center gap-1.5 text-slate-400">
                {icon}
                <span className="text-xs font-medium">{label}</span>
              </div>
              <p className="text-xl font-bold leading-snug text-white">{value}</p>
              <div className="flex items-center gap-1 text-xs">
                {up !== null && (
                  <ArrowUpRight size={11} className={up ? "text-teal-400" : "text-red-400"} />
                )}
                <span className={up ? "text-teal-400" : "text-slate-500"}>{delta}</span>
                <span className="mx-0.5 text-slate-600">·</span>
                <span className="text-slate-500">{sub}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3열 메인 그리드 ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[270px_1fr_1fr]">

        {/* LEFT: 지역 기회 순위 */}
        <div className="surface">
          <SectionHeader title="지역별 금융 기회 순위" sub="종합 점수 기준 (0~100 정규화)" />
          <div className="divide-y divide-slate-50">
            {sampleOpportunityRows.map((row) => {
              const shortSido = row.sido
                .replace("특별자치도", "").replace("특별자치시", "")
                .replace("특별시", "").replace("광역시", "").replace("도", "").replace("시", "");
              return (
                <div key={row.id} className="px-4 py-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600">
                      {row.rank}
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-800">{row.sigungu}</span>
                    <span className="shrink-0 text-xs text-slate-400">{shortSido}</span>
                    <ScorePill score={row.overallOpportunityScore} />
                  </div>
                  <ScoreBar score={row.overallOpportunityScore} />
                  <div className="mt-1.5 flex items-center text-xs text-slate-500">
                    <span className="truncate">{row.topNationality} · {row.dominantSegment}</span>
                    <span className="ml-auto shrink-0 font-semibold text-teal-600">
                      YoY {formatPercent(row.yoyChangeRate)} ↑
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: 국적 분포 + 체류자격 */}
        <div className="flex flex-col gap-5">
          {/* 국적별 수평 막대 */}
          <div className="surface">
            <SectionHeader title="상위 국적 분포" sub="샘플 지역 거주자 수 · 시장 규모 비교" />
            <div className="px-4 pb-2 pt-4">
              <div className="space-y-3">
                {nationalityDistributionData.map((d) => (
                  <div
                    key={d.nationality}
                    className="grid items-center gap-x-2 text-sm"
                    style={{ gridTemplateColumns: "4.5rem 1fr 4.8rem 2.4rem" }}
                  >
                    <span className="truncate font-medium text-slate-700">{d.nationality}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-500 transition-all"
                        style={{ width: `${(d.share / maxNatShare) * 100}%` }}
                      />
                    </div>
                    <span className="text-right font-semibold text-slate-800">
                      {formatNumber(d.residents)}
                    </span>
                    <span className="text-right text-xs text-slate-400">{d.share}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-box">
              <NationalityBarChart />
            </div>
          </div>

          {/* 체류자격 세그먼트 */}
          <div className="surface">
            <SectionHeader title="체류자격 세그먼트 분포" sub="비중 기준 (%) · 금융 수요 분류" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-4 pb-3 pt-3">
              {visaDistributionData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${VISA_COLORS[i]}`} />
                  <span className="truncate text-slate-700">{d.name}</span>
                  <span className="ml-auto font-bold text-slate-800">{d.value}%</span>
                </div>
              ))}
            </div>
            <div style={{ height: 200, padding: "0 14px 16px" }}>
              <VisaDonutChart />
            </div>
          </div>
        </div>

        {/* RIGHT: 추세 + 분석 포인트 */}
        <div className="flex flex-col gap-5">
          {/* 월별 추세 */}
          <div className="surface">
            <SectionHeader title="국적별 월별 유입 추세" sub="주요 4개 국적 · 2025년 7~12월 샘플" />
            <div className="chart-box">
              <TrendLineChart />
            </div>
          </div>

          {/* 분석 포인트 */}
          <div className="surface">
            <SectionHeader title="분석 포인트" sub="기회 점수 기반 자동 생성 인사이트" />
            <div className="divide-y divide-slate-50">
              {sampleRegionInsights.slice(0, 3).map((insight, idx) => (
                <div key={insight.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-800">{insight.title}</p>
                    </div>
                    <ScorePill score={insight.score} />
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-600">
                    {insight.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 하단 상세 테이블 ── */}
      <div className="surface">
        <SectionHeader
          title="금융 기회 점수 상세 분석"
          sub="지역·국적·세그먼트 전체 항목 · 클릭하여 상세 페이지 이동"
        />
        <div className="p-2">
          <RankingTable rows={sampleOpportunityRows} />
        </div>
      </div>
    </div>
  );
}
