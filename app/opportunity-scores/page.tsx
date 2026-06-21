import { BarChart3, Globe, MapPin, Send, TrendingDown, TrendingUp } from "lucide-react";

import { Panel } from "@/components/ui/Panel";
import { PageHero } from "@/components/ui/PageHero";
import { StatTile } from "@/components/ui/StatTile";
import { RealSidoOpportunityTable } from "@/components/data/RealSidoOpportunityTable";
import { SidoScoreCompositionChart } from "@/components/charts/SidoScoreCompositionChart";
import { SparkLineChart } from "@/components/charts/SparkLineChart";
import {
  bopNationalLatest,
  hasRealSidoOpportunity,
  realSidoOpportunity
} from "@/lib/data/opportunityReal";
import { realBopTransferIncome } from "@/lib/data/generated/realData";
import { sidoForeignerTotal, sidoForeignerLatestYear } from "@/lib/data/regionAggregates";
import { formatNumber } from "@/lib/utils/format";

export default function OpportunityScoresPage() {
  // 실데이터 시도 통계
  const topSido = realSidoOpportunity[0];
  const fastestSido = hasRealSidoOpportunity
    ? [...realSidoOpportunity].filter((r) => r.yoy != null).sort((a, b) => (b.yoy ?? 0) - (a.yoy ?? 0))[0]
    : null;

  // BOP 이전소득수지 지표 계산 (한국은행 ECOS 301Y013)
  const bopAnnual = [...realBopTransferIncome.annual].sort((a, b) => a.year - b.year);
  const bopLatest = bopAnnual.at(-1);
  const bopPrev = bopAnnual.at(-2);
  const bopYoY = bopLatest && bopPrev && bopPrev.value
    ? ((bopLatest.value - bopPrev.value) / bopPrev.value) * 100
    : null;
  const bopSparkData = bopAnnual.map((p) => ({ label: p.year, value: p.value }));
  const bopPerCapita = bopNationalLatest > 0 && sidoForeignerTotal > 0
    ? Math.round((bopNationalLatest * 1_000_000) / sidoForeignerTotal)
    : null;
  // 1위 시도 BOP 추정
  const topSidoBop = topSido?.bopMarketEst ?? 0;

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="금융 기회 점수"
        title="전략 실행 우선순위 랭킹"
        description="어느 지역을 먼저 공략해야 하는가. 외국인 규모·유학생·성장률로 0~100 기회점수를 산출하고, ECOS 이전소득수지(301Y013)로 시도별 송금시장 규모를 추정합니다. 지리적 분포는 사이드바 → 지역 분석에서 확인하세요."
      />

      {/* BOP 거시지표 컨텍스트 (ECOS 이전소득수지 301Y013) */}
      {bopNationalLatest > 0 && (
        <Panel
          title="전국 외국인 송금시장 규모 (이전소득수지)"
          subtitle={`한국은행 ECOS 301Y013 · ${bopLatest?.year ?? ""} 연간 · 이 시장 규모가 아래 기회점수의 경제적 맥락입니다`}
          right={
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
              ECOS 실데이터
            </span>
          }
          bodyClassName="p-0"
        >
          <div className="grid grid-cols-1 gap-0 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {/* 좌: 전국 합계 + 스파크라인 */}
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted">전국 이전소득수지</p>
                  <p className="mt-1 text-[1.8rem] font-black leading-none text-ink">
                    ${(bopNationalLatest / 1000).toFixed(1)}<span className="text-base font-semibold text-muted">십억</span>
                  </p>
                  {bopYoY != null && (
                    <div className="mt-1 flex items-center gap-1 text-xs font-bold" style={{ color: bopYoY >= 0 ? "#059669" : "#dc2626" }}>
                      {bopYoY >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {bopYoY >= 0 ? "+" : ""}{bopYoY.toFixed(1)}% YoY
                    </div>
                  )}
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#059669" }}>
                  <Send size={18} aria-hidden />
                </span>
              </div>
              <div style={{ height: 72 }}>
                <SparkLineChart data={bopSparkData} color="#059669" unit="백만$" />
              </div>
              <p className="text-[10px] text-muted">{bopAnnual[0]?.year}~{bopLatest?.year} 연간 추이 · 단위 백만달러</p>
            </div>

            {/* 중: 1인당 추정 + 외국인 인구 */}
            <div className="flex flex-col justify-center gap-4 p-5">
              <div>
                <p className="text-xs font-semibold text-muted">외국인 1인당 연간 추정</p>
                <p className="mt-1 text-[1.5rem] font-black leading-none text-ink">
                  {bopPerCapita ? `$${formatNumber(bopPerCapita)}` : "—"}
                </p>
                <p className="mt-1 text-[11px] text-muted">전국 BOP ÷ 행안부 외국인주민 합계</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">분석 대상 인구</p>
                <p className="mt-1 text-[1.2rem] font-bold text-ink">{formatNumber(sidoForeignerTotal)}<span className="ml-1 text-xs text-muted">명</span></p>
                <p className="mt-0.5 text-[11px] text-muted">행안부 {sidoForeignerLatestYear}년 기준</p>
              </div>
            </div>

            {/* 우: 1위 시도 BOP 추정 + 상위 시도 */}
            <div className="flex flex-col gap-3 p-5">
              <div>
                <p className="text-xs font-semibold text-muted">1위 시도 송금시장 추정</p>
                <p className="mt-1 text-[1.5rem] font-black leading-none text-ink">
                  {topSidoBop > 0
                    ? topSidoBop >= 1000
                      ? `$${(topSidoBop / 1000).toFixed(1)}B`
                      : `$${topSidoBop.toFixed(0)}M`
                    : "—"}
                </p>
                <p className="mt-1 text-[11px] text-muted">{topSido?.sido ?? ""} · 전국 BOP × 거주비중</p>
              </div>
              <div className="space-y-1.5">
                {realSidoOpportunity.slice(0, 5).map((r) => {
                  const pct = topSidoBop > 0 ? Math.round((r.bopMarketEst / topSidoBop) * 100) : 0;
                  return (
                    <div key={r.sido} className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 shrink-0 truncate font-semibold text-ink">{r.sido}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-emerald-700">
                        ${r.bopMarketEst >= 1000
                          ? `${(r.bopMarketEst / 1000).toFixed(1)}B`
                          : `${r.bopMarketEst.toFixed(0)}M`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted">송금시장 추정 상위 5개 시도 · ECOS BOP 비례 배분</p>
            </div>
          </div>
        </Panel>
      )}

      {/* 실데이터 시도 기회 점수 (행안부 외국인주민 + KEDI 유학생 + 증가율) */}
      <RealSidoOpportunityTable />

      {/* 기회점수 구성 차트 — 규모·유학생·성장 가중 기여도 */}
      {hasRealSidoOpportunity && (
        <Panel
          title="시도별 기회점수 구성 분해"
          subtitle="각 막대 = 규모(×50%) + 유학생(×30%) + 성장(×20%) 가중 기여도 합산 · 끝의 숫자는 종합 점수"
          right={
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#0f766e" }} />규모</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#3157a4" }} />유학생</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#be123c" }} />성장</span>
            </div>
          }
          bodyClassName="p-0"
        >
          <div style={{ height: 560 }} className="px-4 py-4">
            <SidoScoreCompositionChart />
          </div>
        </Panel>
      )}

      <div className="stat-grid">
        <StatTile
          label="1위 시도 (기회점수)"
          value={hasRealSidoOpportunity && topSido ? topSido.sido : "—"}
          accent="#0f766e"
          icon={<Globe size={18} />}
          trend={hasRealSidoOpportunity && topSido
            ? { label: `종합 ${topSido.overallScore}점`, dir: "up" }
            : undefined}
          sub={hasRealSidoOpportunity && topSido
            ? `외국인주민 ${formatNumber(topSido.residentCount)}명 · 유학생 ${formatNumber(topSido.studentCount)}명`
            : "실데이터 수집 전"}
        />
        <StatTile
          label="최고 성장 시도"
          value={hasRealSidoOpportunity && fastestSido ? fastestSido.sido : "—"}
          accent="#3157a4"
          icon={<TrendingUp size={18} />}
          trend={hasRealSidoOpportunity && fastestSido?.yoy != null
            ? { label: "전년 대비", dir: "up" }
            : undefined}
          sub={hasRealSidoOpportunity && fastestSido?.yoy != null
            ? `YoY +${fastestSido.yoy.toFixed(1)}%`
            : "실데이터 수집 전"}
        />
        <StatTile
          label="전국 송금시장 추정"
          value={bopNationalLatest > 0 ? `$${(bopNationalLatest / 1000).toFixed(1)}십억` : "—"}
          accent="#b45309"
          icon={<BarChart3 size={18} />}
          sub={bopLatest ? `ECOS 이전소득수지 ${bopLatest.year}년 · 301Y013` : "ECOS 데이터 없음"}
        />
        <StatTile
          label="시도 평균 기회점수"
          value={hasRealSidoOpportunity
            ? (realSidoOpportunity.reduce((s, r) => s + r.overallScore, 0) / realSidoOpportunity.length).toFixed(1)
            : "—"}
          unit={hasRealSidoOpportunity ? "/ 100" : ""}
          accent="#be123c"
          icon={<MapPin size={18} />}
          sub={hasRealSidoOpportunity ? `${realSidoOpportunity.length}개 시도 가중 평균` : "실데이터 수집 전"}
        />
      </div>

      <Panel
        title="점수 산식 설명"
        subtitle="0~100 정규화 후 설명 가능한 가중치로 합성한 전체 기회 점수입니다."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm leading-relaxed text-muted">
            <p>
              각 세부 지표(송금·유학생·급여계좌·다국어)는 지역 간 상대값을 0~100으로 정규화한 뒤,
              사업 우선순위에 맞춘 가중치로 합산해 전체 기회 점수를 만듭니다.
            </p>
            <p>
              내부 금융 데이터가 없을 때는 체류자격·국적 집중도·성장률 등 공개 집계 지표로 대체
              점수를 산출하여, 개인 단위 정보 없이도 시장 기회를 비교할 수 있습니다.
            </p>
          </div>
          <div className="tag-list self-start">
            <span className="tag" style={{ borderColor: "#0f766e", color: "#0f766e" }}>
              송금 · remittanceNeedScore
            </span>
            <span className="tag" style={{ borderColor: "#3157a4", color: "#3157a4" }}>
              유학생 · studentFinanceScore
            </span>
            <span className="tag" style={{ borderColor: "#b45309", color: "#b45309" }}>
              급여계좌 · payrollNeedScore
            </span>
            <span className="tag" style={{ borderColor: "#be123c", color: "#be123c" }}>
              다국어 · multilingualCsScore
            </span>
            <span className="tag">전체 · overallOpportunityScore</span>
          </div>
        </div>
      </Panel>

    </div>
  );
}
