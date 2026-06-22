import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Banknote,
  Briefcase,
  DollarSign,
  GraduationCap,
  MapPin,
  Send,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { InsightCard } from "@/components/cards/InsightCard";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { VisaDonutChart } from "@/components/charts/VisaDonutChart";
import { ScoreRadarChart } from "@/components/charts/ScoreRadarChart";
import { RegionMap } from "@/components/charts/RegionMap";
import { SparkLineChart } from "@/components/charts/SparkLineChart";
import { MiniBarChart } from "@/components/charts/MiniBarChart";
import {
  econActivityData,
  hasEconActivity,
  hasHealthInsurance,
  hasMulticulturalFamily,
  hasNationalityByAge,
  hasRealStudentData,
  hasRealUniversityData,
  hasRealVisaData,
  healthInsuranceData,
  kpiSummary,
  multiculturalFamilyData,
  multiculturalFamilySummary,
  nationalityAgeTotals,
  sampleRegionInsights,
  stayVisaTypes,
  visaDistributionData
} from "@/lib/data/mockData";
import {
  realDataSummary,
  realForeignWage,
  realEpsIntroduction,
  realForeignStudentNationality,
  realStudentSummary,
  realBopTransferIncome,
  realExchangeRate,
  realForeignEmploymentStatus,
  realDutyFreeSales,
  realNationalityDistribution,
} from "@/lib/data/generated/realData";
import { HomeExtraData } from "@/components/data/HomeExtraData";
import { formatNumber, scoreColor } from "@/lib/utils/format";
import {
  hasSidoForeignerStats,
  hasSidoForeignerTrend,
  sidoForeignerTrend
} from "@/lib/data/regionAggregates";
import { DataFreshnessBanner } from "@/components/ui/DataFreshness";
import { DONUT_PALETTE } from "@/lib/theme/chartPalette";

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

const DONUT_COLORS = DONUT_PALETTE;

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
  const totalRows = realDataSummary.statusRowCount + realDataSummary.regionRowCount;

  // 실데이터 기반 KPI 계산
  const totalResidents = realNationalityDistribution.length > 0
    ? realNationalityDistribution.reduce((s, r) => s + r.residents, 0)
    : 2_459_883;
  const hasRealTotal = realNationalityDistribution.length > 0;
  const foreignStudents = realStudentSummary.hasData ? realStudentSummary.total : 173_490;
  const loadedDatasets = [
    realNationalityDistribution.length > 0, hasRealVisaData, hasRealStudentData, hasRealUniversityData,
    hasNationalityByAge, hasHealthInsurance, hasMulticulturalFamily, hasEconActivity
  ].filter(Boolean).length;

  // 국적별 TOP3 (실데이터)
  const top3Nationalities = realNationalityDistribution.slice(0, 3);
  const avg = 66.4; // 기회 점수 — 지역 실데이터 확보 시 실데이터로 교체 예정

  // delta = 실데이터 기반 YoY(있을 때만 녹색 칩), note = YoY가 아닌 보조 설명(중립 표기).
  const kpis: {
    label: string;
    display: string;
    unit: string;
    icon: typeof Users;
    color: string;
    sub: string;
    delta?: string;
    note?: string;
  }[] = [
    {
      label: "총 체류외국인",
      display: formatNumber(totalResidents),
      unit: "명",
      icon: Users,
      color: "#0f766e",
      sub: hasRealTotal ? "법무부 실데이터 2024" : "법무부 체류통계"
    },
    {
      label: "등록외국인",
      display: formatNumber(kpiSummary.registeredResidents > 0 ? kpiSummary.registeredResidents : 1_320_540),
      unit: "명",
      icon: Banknote,
      color: "#3157a4",
      sub: "장기체류 비자 합계 · 금융 주고객"
    },
    {
      label: "외국인 유학생",
      display: formatNumber(foreignStudents),
      unit: "명",
      icon: GraduationCap,
      color: "#b45309",
      sub: "D-2 / D-4 체류",
      delta: hasRealStudentData ? `+${realStudentSummary.yoy}%` : undefined
    },
    {
      label: "평균 금융기회점수",
      display: avg.toFixed(1),
      unit: "/ 100",
      icon: BarChart3,
      color: "#be123c",
      sub: "복합 기회지수",
      note: `${realNationalityDistribution.length}개 국적 기준`
    }
  ];

  // ── 신규 실데이터 파생 지표 ────────────────────────────────────────────────────
  // 외국인 월평균 임금구간 분포(단위 천명) — band 중복 제거 후 최다 구간 산출
  const wageBands = Array.from(
    new Map(realForeignWage.distribution.map((d) => [d.band, d])).values()
  );
  const wageTotal = wageBands.reduce((sum, b) => sum + b.value, 0);
  const wageTop = wageBands.length
    ? wageBands.reduce((max, b) => (b.value > max.value ? b : max), wageBands[0])
    : null;
  const wageTopPct = wageTop && wageTotal > 0 ? (wageTop.value / wageTotal) * 100 : 0;

  // E-9 도입(고용허가제) — 최신연도 합계(trend 마지막) + 1위 국가 + 연도 추세 스파크
  const epsTrend = Array.from(
    new Map(realEpsIntroduction.trend.map((t) => [t.year, t])).values()
  ).sort((a, b) => a.year - b.year);
  const epsLatest = epsTrend.length ? epsTrend[epsTrend.length - 1] : null;
  const epsTopCountry = realEpsIntroduction.byCountry.length
    ? realEpsIntroduction.byCountry[0]
    : null;
  const epsSpark = epsTrend.map((t) => ({ label: t.year, value: t.value }));

  // 유학생 1위 국적 + 국적 TOP5 미니 막대
  const studentNats = realForeignStudentNationality.byNationality;
  const studentTop = studentNats.length ? studentNats[0] : null;
  const studentTotalTop = studentNats.reduce((sum, n) => sum + n.value, 0);
  const studentTopPct =
    studentTop && studentTotalTop > 0 ? (studentTop.value / studentTotalTop) * 100 : 0;
  const studentBars = studentNats
    .slice(0, 5)
    .map((n) => ({ label: n.nationality, value: n.value }));

  // ── 실데이터 금융 시그널 (본국송금 · 환율 · 상용직 · 면세소비) ────────────────────
  const bopAnnual = [...realBopTransferIncome.annual].sort((a, b) => a.year - b.year);
  const bopLatest = bopAnnual.length ? bopAnnual[bopAnnual.length - 1] : null;
  const bopPrev = bopAnnual.length > 1 ? bopAnnual[bopAnnual.length - 2] : null;
  const bopYoY = bopLatest && bopPrev && bopPrev.value ? ((bopLatest.value - bopPrev.value) / bopPrev.value) * 100 : null;

  const fxUsd = realExchangeRate.latest?.usd ?? null;
  const fxMonthly = realExchangeRate.monthly;
  const fxLastMonth = fxMonthly.length ? fxMonthly[fxMonthly.length - 1] : null;
  const fxPrevMonth = fxMonthly.length > 1 ? fxMonthly[fxMonthly.length - 2] : null;
  const fxMoM = fxLastMonth && fxPrevMonth && fxPrevMonth.usd ? ((fxLastMonth.usd - fxPrevMonth.usd) / fxPrevMonth.usd) * 100 : null;
  const fxDate = fxUsd ? `${fxUsd.date.slice(0, 4)}.${fxUsd.date.slice(4, 6)}.${fxUsd.date.slice(6, 8)}` : "";

  const dutyTop = realDutyFreeSales.byNationality.length ? realDutyFreeSales.byNationality[0] : null;
  const dutyTopPct = dutyTop && realDutyFreeSales.foreignTotal ? (dutyTop.value / realDutyFreeSales.foreignTotal) * 100 : 0;

  const bopSparkData = bopAnnual.map((p) => ({ label: p.year, value: p.value }));
  const fxSparkData = fxMonthly
    .slice(-12)
    .filter((p) => (p.usd as number | null) != null)
    .map((p) => ({ label: p.month as string | number, value: p.usd as number }));

  const signals: {
    label: string;
    value: string;
    unit: string;
    sub: string;
    delta: number | null;
    deltaSuffix: string;
    deltaInverse: boolean;
    icon: typeof Send;
    color: string;
    sparkData?: { label: string | number; value: number }[];
    sparkUnit?: string;
  }[] = [
    {
      label: "본국송금 (이전소득수지)",
      value: bopLatest ? (bopLatest.value / 100).toFixed(1) : "—",
      unit: "억$",
      sub: bopLatest ? `${bopLatest.year} 연간 · 한국은행 ECOS` : "데이터 없음",
      delta: bopYoY,
      deltaSuffix: "YoY",
      deltaInverse: false,
      icon: Send,
      color: "#0f766e",
      sparkData: bopSparkData.length >= 2 ? bopSparkData : undefined,
      sparkUnit: "백만$"
    },
    {
      label: "원/달러 환율",
      value: fxUsd ? formatNumber(Math.round(fxUsd.value)) : "—",
      unit: "원",
      sub: fxUsd ? `${fxDate} 기준 · ECOS 일별` : "데이터 없음",
      delta: fxMoM,
      deltaSuffix: "MoM",
      deltaInverse: true,
      icon: DollarSign,
      color: "#3157a4",
      sparkData: fxSparkData.length >= 2 ? fxSparkData : undefined,
      sparkUnit: "원"
    },
    {
      label: "외국인 상용직 비중",
      value: realForeignEmploymentStatus.regularShare != null ? realForeignEmploymentStatus.regularShare.toFixed(1) : "—",
      unit: "%",
      sub: realForeignEmploymentStatus.regularShare != null
        ? `상용 ${formatNumber(realForeignEmploymentStatus.regular)}천명 / 취업 ${formatNumber(realForeignEmploymentStatus.total)}천명 · ${realForeignEmploymentStatus.latestYear}`
        : "데이터 없음",
      delta: null,
      deltaSuffix: "",
      deltaInverse: false,
      icon: Briefcase,
      color: "#b45309"
    },
    {
      label: "면세 소비 1위 국적",
      value: dutyTop ? dutyTop.nationality : "—",
      unit: "",
      sub: dutyTop ? `외국인 면세매출의 ${dutyTopPct.toFixed(1)}% · ${realDutyFreeSales.latestYear} JDC` : "데이터 없음",
      delta: null,
      deltaSuffix: "",
      deltaInverse: false,
      icon: ShoppingBag,
      color: "#be123c"
    }
  ];

  return (
    <div className="space-y-6 pb-14">

      <PageHero
        kicker="대시보드"
        title="외국인 금융 시장 데이터"
        description="공개 통계와 금융 집계 데이터를 지역·국적·체류자격·대학 단위로 실시간 시각화합니다. 전략 해석은 사이드바 → 금융 인사이트에서 확인하세요."
      />

      {/* ── 데이터 신선도 배너 (뷰 시점 실시간 판정) ── */}
      <DataFreshnessBanner
        generatedAt={realDataSummary.generatedAt}
        totalRows={totalRows}
        loadedDatasets={loadedDatasets}
      />



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
                <span className="text-[1.6rem] font-black leading-none text-ink sm:text-[2.1rem]">{kpi.display}</span>
                <span className="mb-0.5 text-sm text-muted">{kpi.unit}</span>
              </div>
              <div className="flex items-center justify-between">
                {kpi.delta ? (
                  <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: "#059669" }}>
                    <ArrowUpRight size={13} />{kpi.delta} YoY
                  </span>
                ) : kpi.note ? (
                  <span className="text-xs font-semibold text-muted">{kpi.note}</span>
                ) : (
                  <span />
                )}
                <span className="text-[10px] text-muted">{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── 실데이터 금융 시그널 (본국송금 · 환율 · 상용직 · 면세소비) ── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#697586" }}>
            실데이터 금융 시그널
          </span>
          <span className="text-[11px] text-muted">한국은행 ECOS · 통계청 · JDC 면세 — 매 배치 자동 갱신</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {signals.map((s) => {
            const Icon = s.icon;
            const good = s.delta == null ? null : s.deltaInverse ? s.delta < 0 : s.delta >= 0;
            const deltaColor = good == null ? "#697586" : good ? "#059669" : "#dc2626";
            const DeltaIcon = s.delta != null && s.delta < 0 ? TrendingDown : TrendingUp;
            return (
              <div key={s.label} className="surface relative flex flex-col gap-2 overflow-hidden p-5">
                <span className="absolute left-0 top-0 h-1 w-full" style={{ background: s.color }} />
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-muted">{s.label}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: s.color }}>
                    <Icon aria-hidden size={18} />
                  </span>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="truncate text-[1.5rem] font-black leading-none text-ink sm:text-[1.9rem]">{s.value}</span>
                  {s.unit && <span className="mb-0.5 text-sm text-muted">{s.unit}</span>}
                </div>
                {s.sparkData && (
                  <div style={{ height: 52 }} className="-mx-1">
                    <SparkLineChart data={s.sparkData} color={s.color} unit={s.sparkUnit ?? ""} />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  {s.delta != null ? (
                    <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: deltaColor }}>
                      <DeltaIcon size={13} />
                      {s.delta >= 0 ? "+" : ""}{s.delta.toFixed(1)}% {s.deltaSuffix}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="truncate text-[10px] text-muted">{s.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 신규 실데이터 인사이트 카드 (임금대역 · E-9 도입 · 유학생 국적) ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* 외국인 임금 중앙대역 / 최다 구간 */}
        <div className="surface flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="surface-title text-sm">외국인 임금 최다 구간</h3>
              <p className="surface-subtitle">통계청 · {realForeignWage.latestYear} · 월평균 임금분포</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ background: "#0369a1" }}
            >
              <Banknote aria-hidden size={18} />
            </span>
          </div>
          {wageTop ? (
            <>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-[1.5rem] font-black leading-tight text-ink">{wageTop.band}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="font-bold" style={{ color: "#0369a1" }}>
                  {formatNumber(wageTop.value)} {realForeignWage.unit}
                </span>
                <span className="text-muted">· 전체의 {wageTopPct.toFixed(1)}%</span>
              </div>
              {/* 구간 분포 미니 막대 */}
              <div className="mt-4 space-y-2">
                {wageBands.map((b) => {
                  const max = wageTop.value || 1;
                  return (
                    <div key={b.band} className="flex items-center gap-2 text-[11px]">
                      <span className="w-28 shrink-0 truncate text-slate-600">{b.band}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${Math.max(3, Math.round((b.value / max) * 100))}%`, background: b === wageTop ? "#0369a1" : "#93c5fd" }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right font-mono text-muted">{formatNumber(b.value)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-muted">단위: {realForeignWage.unit} · 200~300만원대가 임금 중앙대역</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">임금분포 데이터 없음</p>
          )}
        </div>

        {/* 최신연도 E-9 도입 합계 + top 국가 + 추세 스파크 */}
        <div className="surface flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="surface-title text-sm">E-9 도입 (고용허가제)</h3>
              <p className="surface-subtitle">
                {epsLatest ? `${epsLatest.year} 도입 합계` : "도입 추세"} · {realEpsIntroduction.unit}
              </p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ background: "#0f766e" }}
            >
              <Users aria-hidden size={18} />
            </span>
          </div>
          {epsLatest ? (
            <>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="text-[1.6rem] font-black leading-none text-ink sm:text-[2.1rem]">{formatNumber(epsLatest.value)}</span>
                <span className="mb-0.5 text-sm text-muted">{realEpsIntroduction.unit}</span>
              </div>
              {epsTopCountry && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: "#0f766e" }}>
                    1위 {epsTopCountry.country}
                  </span>
                  <span className="text-muted">{formatNumber(epsTopCountry.value)} {realEpsIntroduction.unit}</span>
                </div>
              )}
              {/* 연도별 도입 추세 스파크라인 */}
              <div className="mt-3" style={{ height: 80 }}>
                <SparkLineChart data={epsSpark} color="#0f766e" unit={`${realEpsIntroduction.unit}`} />
              </div>
              <p className="mt-2 text-[10px] text-muted">연도별 도입 추세 ({epsTrend.length ? `${epsTrend[0].year}–${epsLatest.year}` : "-"})</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">E-9 도입 데이터 없음</p>
          )}
        </div>

        {/* 유학생 1위 국적 + TOP5 미니 막대 */}
        <div className="surface flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="surface-title text-sm">유학생 1위 국적</h3>
              <p className="surface-subtitle">법무부 · {realForeignStudentNationality.latestYear} · 국적별 유학생(명)</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ background: "#b45309" }}
            >
              <GraduationCap aria-hidden size={18} />
            </span>
          </div>
          {studentTop ? (
            <>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="truncate text-[1.3rem] font-black leading-none text-ink sm:text-[1.7rem]">{studentTop.nationality}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="font-bold" style={{ color: "#b45309" }}>{formatNumber(studentTop.value)} 명</span>
                <span className="text-muted">· 상위국 합계의 {studentTopPct.toFixed(1)}%</span>
              </div>
              {/* 국적 TOP5 미니 막대 차트 */}
              <div className="mt-3" style={{ height: 96 }}>
                <MiniBarChart data={studentBars} unit="명" />
              </div>
              <p className="mt-2 text-[10px] text-muted">국적별 유학생 TOP {studentBars.length} · 단위: 명</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">유학생 국적 데이터 없음</p>
          )}
        </div>
      </section>

      {/* ── 시각화 히어로: 지역 지도 + 체류자격 도넛 ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">

        {/* 지역별 기회 버블 지도 */}
        <div className="surface overflow-hidden">
          <div className="surface-header pb-1">
            <div>
              <h3 className="surface-title flex items-center gap-1.5">
                <MapPin size={16} style={{ color: "#0f766e" }} />
                {hasSidoForeignerStats ? "지역별 외국인주민 분포 지도" : "지역별 금융 기회 지도"}
              </h3>
              <p className="surface-subtitle">
                {hasSidoForeignerStats
                  ? "거품 크기·색상 = 시도별 외국인주민 규모 (행안부 실데이터)"
                  : "거품 크기 = 외국인 규모 · 색상 = 기회 점수(표본)"}
              </p>
            </div>
            <Link href="/regions" className="text-xs font-semibold" style={{ color: "#0f766e" }}>
              지역 분석 →
            </Link>
          </div>
          <div className="flex items-center justify-center px-2 pb-2">
            <RegionMap />
          </div>
          {hasSidoForeignerTrend && (
            <div className="border-t border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500">전국 외국인주민 연도별 추이</p>
                <p className="text-[10px] text-muted">
                  {sidoForeignerTrend[0].year}~{sidoForeignerTrend.at(-1)!.year} · {(sidoForeignerTrend.at(-1)!.total / 10000).toFixed(0)}만명
                </p>
              </div>
              <div style={{ height: 70 }}>
                <SparkLineChart
                  data={sidoForeignerTrend.map((p) => ({ label: p.year, value: p.total }))}
                  color="#0f766e"
                  unit="명"
                />
              </div>
            </div>
          )}
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

          {/* 국적별 TOP 3 (실데이터) */}
          <div className="surface p-4">
            <h3 className="surface-title mb-3 px-1 text-sm">국적별 규모 TOP 3</h3>
            <div className="space-y-2.5">
              {top3Nationalities.map((row, i) => (
                <div key={row.nationality} className="flex items-center gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ background: ["#0f766e", "#3157a4", "#b45309"][i] }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="truncate text-sm font-bold text-ink">{row.nationality}</span>
                      <span className="text-[11px] text-muted">{row.share}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#e2e8f0" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, row.share * 4)}%`, background: ["#0f766e", "#3157a4", "#b45309"][i] }} />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink">
                    {formatNumber(row.residents)}
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
              <h3 className="surface-title">국적별 분포 TOP {Math.min(10, realNationalityDistribution.length)}</h3>
              <p className="surface-subtitle">{realNationalityDistribution.length > 0 ? "법무부 국적별 현황 2024" : "표본 지역 기준"}</p>
            </div>
          </div>
          <div style={{ height: 340 }} className="px-2 pb-3 pt-2">
            <NationalityBarChart data={realNationalityDistribution.slice(0, 10)} />
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
            <Link href="/economy#health" className="surface surface-hover p-5">
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
            <Link href="/economy#welfare" className="surface surface-hover p-5">
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
            <Link href="/economy#econ-activity" className="surface surface-hover p-5">
              <h3 className="surface-title mb-1">외국인 경제활동인구</h3>
              <p className="surface-subtitle mb-3">통계청 · 체류자격별 취업·경제활동</p>
              <div className="space-y-2">
                {(() => {
                  // economy 페이지와 동일 로직: 경제활동인구 표(천명)만 사용, 합계행 제외, 체류자격별 첫 ITM만 dedup.
                  const ECON_SRC = "kosis_foreigner_economic_activity";
                  const econRows = econActivityData.filter((r) => r.sourceId === ECON_SRC && r.category !== "계");
                  const latest = [...econRows].sort((a, b) => b.period.localeCompare(a.period))[0]?.period ?? "";
                  const byCat = new Map<string, (typeof econRows)[number]>();
                  for (const r of econRows.filter((r) => r.period === latest)) {
                    if (!byCat.has(r.category)) byCat.set(r.category, r);
                  }
                  const rows = [...byCat.values()].sort((a, b) => b.value - a.value).slice(0, 5);
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
            <table className="w-full min-w-[560px] text-sm">
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

      <HomeExtraData />
    </div>
  );
}
