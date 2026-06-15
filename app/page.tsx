import {
  ArrowUpRight,
  BarChart3,
  Banknote,
  GraduationCap,
  TrendingUp,
  Users
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { InsightCard } from "@/components/cards/InsightCard";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { VisaDonutChart } from "@/components/charts/VisaDonutChart";
import {
  kpiSummary,
  nationalityDistributionData,
  sampleOpportunityRows,
  sampleRegionInsights,
  visaDistributionData
} from "@/lib/data/mockData";
import { realDataSummary } from "@/lib/data/generated/realData";
import { formatNumber, formatScore } from "@/lib/utils/format";

// ── 서버 렌더링 가능한 인라인 컴포넌트 ──────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 72) return "#0f766e";
  if (score >= 55) return "#3157a4";
  if (score >= 40) return "#b45309";
  return "#be123c";
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  return (
    <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#e2e8f0" }}>
      <div
        className="absolute h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: scoreColor(score) }}
      />
    </div>
  );
}

function GrowthBadge({ rate }: { rate: number }) {
  const up = rate >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{
        background: up ? "#ecfdf5" : "#fff1f2",
        color: up ? "#059669" : "#be123c"
      }}
    >
      {up ? "▲" : "▼"} {Math.abs(rate).toFixed(1)}%
    </span>
  );
}

function SegTag({ children }: { children: string }) {
  return (
    <span className="rounded border border-line bg-panel px-1.5 py-0.5 text-[10px] font-medium text-muted">
      {children}
    </span>
  );
}

// ── 금융 상품 수요 매트릭스 ────────────────────────────────────────────────────────
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
  if (v >= 60) return { background: "#ccfbf1", color: "#0f4c41", fontWeight: 600 };
  if (v >= 40) return { background: "#e0f2fe", color: "#0369a1" };
  return { background: "#f8fafc", color: "#cbd5e1" };
}

// ── 상품 아이콘 (이모지 대신 ASCII) ──
const PRODUCT_ICONS: Record<string, string> = {
  "급여계좌": "💳", "본국송금": "✈️", "체크카드": "🪙",
  "신용카드": "💰", "소액저축": "🏦", "보험·연금": "🛡️"
};

export default function DashboardPage() {
  const freshDate = realDataSummary.generatedAt.slice(0, 10);
  const totalRows = realDataSummary.statusRowCount + realDataSummary.regionRowCount;
  const avg = kpiSummary.averageOpportunityScore;

  const kpis = [
    {
      label: "총 체류외국인",
      value: 2_459_883,
      unit: "명",
      trend: "+4.2% YoY",
      icon: Users,
      bg: "#0f766e",
      sub: "법무부 체류통계 기준"
    },
    {
      label: "등록외국인",
      value: 1_320_540,
      unit: "명",
      trend: "+3.8% YoY",
      icon: Banknote,
      bg: "#3157a4",
      sub: "장기체류·금융 주고객층"
    },
    {
      label: "외국인 유학생",
      value: 173_490,
      unit: "명",
      trend: "+12.3% YoY",
      icon: GraduationCap,
      bg: "#b45309",
      sub: "D-2/D-4 체류 기준"
    },
    {
      label: "평균 금융기회점수",
      value: null,
      score: avg,
      unit: "/ 100",
      trend: `상위 ${sampleOpportunityRows.length}개 지역`,
      icon: BarChart3,
      bg: "#be123c",
      sub: "복합 기회지수 평균"
    }
  ];

  return (
    <div className="space-y-7 pb-14">

      <PageHero
        kicker="MVP 대시보드"
        title="국내거주 외국인 금융 인사이트 대시보드"
        description="공개 통계와 내부 금융 집계 데이터를 개인이 아닌 지역·국적·체류자격·대학 단위로 결합해 금융 상품 기획·마케팅·지점 전략을 검토하는 분석 화면입니다."
      />

      {/* ── 데이터 신선도 배너 ── */}
      <div
        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: "#22c55e" }}
        />
        <span>
          수집 기준일:{" "}
          <strong>{freshDate}</strong>
          &nbsp;·&nbsp;누적 수집 {totalRows.toLocaleString()}행
          &nbsp;·&nbsp;매일 18:30 UTC 자동 갱신
        </span>
      </div>

      {/* ── KPI 히어로 스트립 ── */}
      <section>
        <p
          className="mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: "#0f766e" }}
        >
          외국인 금융 시장 핵심 지표
        </p>
        <div className="metric-grid">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="surface flex flex-col gap-3 p-5"
                style={{ borderLeft: `4px solid ${kpi.bg}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-muted">{kpi.label}</span>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ background: kpi.bg }}
                  >
                    <Icon aria-hidden size={18} />
                  </span>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="text-[2.2rem] font-black leading-none text-ink">
                    {kpi.score != null
                      ? kpi.score.toFixed(1)
                      : formatNumber(kpi.value!)}
                  </span>
                  <span className="mb-0.5 text-sm text-muted">{kpi.unit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#059669" }}>
                    <ArrowUpRight size={13} />
                    {kpi.trend}
                  </span>
                  <span className="text-[10px] text-muted">{kpi.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 지역 기회 점수 + 국적 분포 패널 ── */}
      <section className="section-grid" style={{ gap: 20 }}>

        {/* 지역 기회 점수 TOP */}
        <div className="surface overflow-hidden">
          <div className="surface-header pb-3">
            <div>
              <h3 className="surface-title">지역별 금융 기회 점수 순위</h3>
              <p className="surface-subtitle">외국인 밀도 · 성장률 · 세그먼트 · 금융접근성 복합 지수</p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: "#f0fdf4", color: "#0f766e" }}
            >
              TOP {sampleOpportunityRows.length}
            </span>
          </div>

          {/* 점수 헤더바 */}
          <div
            className="grid text-[10px] font-bold uppercase tracking-wider"
            style={{
              gridTemplateColumns: "2rem 1fr 5rem",
              padding: "6px 18px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              color: "#697586"
            }}
          >
            <span>#</span>
            <span>지역 / 세그먼트</span>
            <span className="text-right">점수 / YoY</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sampleOpportunityRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50"
              >
                {/* Rank circle */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ background: scoreColor(row.overallOpportunityScore) }}
                >
                  {row.rank}
                </div>

                {/* Info + bar */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-ink">{row.sido}</span>
                    <span className="text-sm text-muted">{row.sigungu}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <SegTag>{row.dominantSegment}</SegTag>
                    <SegTag>{row.topNationality}</SegTag>
                  </div>
                  <ScoreBar score={row.overallOpportunityScore} />
                </div>

                {/* Score */}
                <div className="shrink-0 text-right">
                  <div
                    className="text-2xl font-black leading-none"
                    style={{ color: scoreColor(row.overallOpportunityScore) }}
                  >
                    {row.overallOpportunityScore.toFixed(0)}
                  </div>
                  <div className="mt-1">
                    <GrowthBadge rate={row.yoyChangeRate ?? 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 추천 액션 요약 */}
          <div
            className="p-4 text-xs text-muted"
            style={{ borderTop: "1px solid #e2e8f0", background: "#fafafa" }}
          >
            <span className="font-semibold text-ink">권장 전략: </span>
            {sampleOpportunityRows[0]?.recommendedAction ?? "—"}
          </div>
        </div>

        {/* 우측 패널 */}
        <div className="flex flex-col gap-5">

          {/* 국적 분포 */}
          <div className="surface">
            <div className="surface-header pb-3">
              <div>
                <h3 className="surface-title">국적별 분포</h3>
                <p className="surface-subtitle">상위 6개국 — 표본 지역 기준</p>
              </div>
            </div>
            <div className="space-y-3 p-4 pt-2">
              {nationalityDistributionData.map((n, i) => {
                const barColors = ["#0f766e", "#3157a4", "#b45309", "#be123c", "#64748b", "#94a3b8"];
                const widthPct = Math.round((n.share / nationalityDistributionData[0].share) * 100);
                return (
                  <div key={n.nationality}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink">{n.nationality}</span>
                      <span className="font-mono text-muted">
                        {formatNumber(n.residents)}명
                        <span className="ml-2 font-bold" style={{ color: barColors[i] }}>
                          {n.share}%
                        </span>
                      </span>
                    </div>
                    <div
                      className="h-4 w-full overflow-hidden rounded"
                      style={{ background: "#f1f5f9" }}
                    >
                      <div
                        className="h-4 rounded"
                        style={{
                          width: `${widthPct}%`,
                          background: barColors[i] ?? "#94a3b8"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 차트 컴포넌트 (Recharts) */}
            <div style={{ height: 180 }} className="px-2 pb-2">
              <NationalityBarChart />
            </div>
          </div>

          {/* 체류자격 도넛 + 범례 */}
          <div className="surface flex flex-col">
            <div className="surface-header pb-2">
              <div>
                <h3 className="surface-title">체류자격 세그먼트</h3>
                <p className="surface-subtitle">비중 분포</p>
              </div>
            </div>
            <div style={{ height: 180 }}>
              <VisaDonutChart />
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-4 pt-0">
              {visaDistributionData.map((d, i) => {
                const colors = ["#0f766e", "#3157a4", "#b45309", "#be123c", "#64748b", "#7c3aed"];
                return (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: colors[i] }}
                    />
                    <span className="truncate text-slate-600">{d.name}</span>
                    <span className="ml-auto font-bold text-ink">{d.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 월별 추세 전체 폭 ── */}
      <section className="surface">
        <div className="surface-header pb-0">
          <div>
            <h3 className="surface-title">주요 국적별 월별 체류 추세</h3>
            <p className="surface-subtitle">
              최근 6개월 · 중국 / 우즈베키스탄 / 베트남 / 몽골 등록외국인 수
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            {["중국", "우즈베키스탄", "베트남", "몽골"].map((n, i) => {
              const colors = ["#0f766e", "#3157a4", "#b45309", "#be123c"];
              return (
                <span key={n} className="flex items-center gap-1">
                  <span className="h-2 w-4 rounded-sm" style={{ background: colors[i] }} />
                  <span className="text-muted">{n}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="chart-box" style={{ height: 300 }}>
          <TrendLineChart />
        </div>
      </section>

      {/* ── 금융 상품 수요 매트릭스 + 인사이트 ── */}
      <section className="two-column" style={{ gap: 20 }}>

        {/* 매트릭스 */}
        <div className="surface">
          <div className="surface-header pb-3">
            <div>
              <h3 className="surface-title">체류자격 × 금융 상품 수요 매트릭스</h3>
              <p className="surface-subtitle">수요 강도 (0–100) — 짙을수록 높은 우선순위</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-muted">세그먼트</th>
                  {PRODUCTS.map((p) => (
                    <th key={p} className="px-2 py-2.5 text-center text-xs font-bold text-muted">
                      <div>{PRODUCT_ICONS[p]}</div>
                      <div>{p}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(DEMAND).map(([seg, vals]) => (
                  <tr
                    key={seg}
                    className="hover:opacity-90"
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td className="px-4 py-2 text-xs font-semibold text-ink whitespace-nowrap">
                      {seg}
                    </td>
                    {vals.map((v, i) => (
                      <td
                        key={i}
                        className="px-2 py-2 text-center text-xs"
                        style={cellStyle(v)}
                      >
                        {v >= 40 ? v : "·"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 범례 */}
          <div
            className="flex flex-wrap items-center gap-4 px-4 py-3 text-xs text-muted"
            style={{ borderTop: "1px solid #e2e8f0" }}
          >
            {[
              { bg: "#0f766e", color: "#fff", label: "80+ 최우선" },
              { bg: "#ccfbf1", color: "#0f4c41", label: "60~79 우선" },
              { bg: "#e0f2fe", color: "#0369a1", label: "40~59 보통" },
              { bg: "#f8fafc", color: "#94a3b8", label: "~39 낮음" }
            ].map(({ bg, color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  className="h-3.5 w-5 rounded-sm border border-line"
                  style={{ background: bg }}
                />
                <span style={{ color }}>{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 인사이트 카드 */}
        <div className="flex flex-col gap-4">
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#697586" }}
          >
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
          <p className="text-xs text-muted">
            * 인사이트는 수집 데이터 기반으로 매일 자동 생성됩니다.
          </p>
        </div>
      </section>

    </div>
  );
}
