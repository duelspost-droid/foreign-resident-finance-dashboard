import { Gauge, MapPin, TrendingUp, Trophy } from "lucide-react";

import { RegionMap } from "@/components/charts/RegionMap";
import { RealSidoOpportunityTable } from "@/components/data/RealSidoOpportunityTable";
import { ScoreRadarChart } from "@/components/charts/ScoreRadarChart";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import {
  hasRealRegionResidents,
  regionResidents,
  regionResidentSummary,
  sampleOpportunityRows
} from "@/lib/data/mockData";
import {
  hasSidoForeignerStats,
  hasSidoForeignerTrend,
  sidoForeignerLatestYear,
  sidoForeignerTotal,
  sidoForeignerTrend
} from "@/lib/data/regionAggregates";
import { formatNumber, formatPercent, formatScore, scoreColor } from "@/lib/utils/format";

export default function RegionsPage() {
  const rows = sampleOpportunityRows;
  const regionCount = rows.length;

  const topRegion = rows.reduce((best, row) =>
    row.overallOpportunityScore > best.overallOpportunityScore ? row : best
  );

  const averageScore =
    rows.reduce((sum, row) => sum + row.overallOpportunityScore, 0) / regionCount;

  const fastestGrowth = rows.reduce((best, row) =>
    row.yoyChangeRate > best.yoyChangeRate ? row : best
  );

  const maxScore = Math.max(...rows.map((row) => row.overallOpportunityScore), 1);

  // 전국 외국인주민 연도별 추이(행안부 실데이터)
  const trend = sidoForeignerTrend;
  const trendMax = Math.max(...trend.map((p) => p.total), 1);
  const trendLatest = trend.at(-1);
  const trendPrev = trend.at(-2);
  const trendYoy =
    trendLatest && trendPrev && trendPrev.total
      ? ((trendLatest.total - trendPrev.total) / trendPrev.total) * 100
      : null;

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="지역 분석"
        title="지역별 외국인 분포와 금융 기회"
        description="시도·시군구 단위의 집계 데이터를 기준으로 외국인 밀집도, 세그먼트, 송금·유학생·급여계좌 수요를 비교해 우선 공략 지역을 도출합니다."
      />

      {/* 실데이터 시도 분포 요약(있을 때) */}
      {hasSidoForeignerStats && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs leading-5 text-teal-800">
          <span className="rounded bg-teal-200 px-1.5 py-0.5 font-bold">실데이터</span>
          <span>
            지도는 <strong>행안부 시도별 외국인주민 현황{sidoForeignerLatestYear ? ` ${sidoForeignerLatestYear}` : ""}</strong>
            (전국 {formatNumber(sidoForeignerTotal)}명) 실집계로 표시됩니다.
          </span>
        </div>
      )}

      {/* 표본 안내: 기회점수·순위·레이더는 아직 시뮬레이션 표본 기반 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800">
        <span className="rounded bg-amber-200 px-1.5 py-0.5 font-bold">표본</span>
        <span>
          아래 <strong>기회 점수·순위·레이더</strong>는 6개 시군구 <strong>시뮬레이션 표본</strong>으로
          산출된 값입니다(실 집계 점수 산출 전). {hasSidoForeignerStats ? "지도는 실데이터입니다." : "지도도 현재 표본 기준입니다."}
        </span>
      </div>

      <div className="stat-grid">
        <StatTile
          label="분석 지역 수"
          value={formatNumber(regionCount)}
          unit="개 시군구"
          icon={<MapPin size={18} />}
          accent="#0f766e"
          sub="시도·시군구 집계 기준"
        />
        <StatTile
          label="1위 지역"
          value={`${topRegion.sido} ${topRegion.sigungu}`}
          icon={<Trophy size={18} />}
          accent="#b45309"
          trend={{ label: `기회점수 ${formatScore(topRegion.overallOpportunityScore)}`, dir: "up" }}
          sub={`대표 국적 ${topRegion.topNationality}`}
        />
        <StatTile
          label="평균 기회점수"
          value={formatScore(averageScore)}
          unit="/ 100"
          icon={<Gauge size={18} />}
          accent="#3157a4"
          sub={`${regionCount}개 지역 평균`}
        />
        <StatTile
          label="최고 성장률"
          value={formatPercent(fastestGrowth.yoyChangeRate)}
          icon={<TrendingUp size={18} />}
          accent="#be123c"
          trend={{ label: "전년 대비", dir: "up" }}
          sub={`${fastestGrowth.sido} ${fastestGrowth.sigungu}`}
        />
      </div>

      {/* 전국 외국인주민 연도별 추이 (행안부 실데이터) */}
      {hasSidoForeignerTrend && trendLatest && (
        <Panel
          title="전국 외국인주민 연도별 추이"
          subtitle={`행안부 시도별 외국인주민 합계 · ${trend[0].year}~${trendLatest.year}`}
          right={
            trendYoy != null ? (
              <span className="eyebrow">전년 대비 {trendYoy >= 0 ? "+" : ""}{trendYoy.toFixed(1)}%</span>
            ) : undefined
          }
          bodyClassName="p-5 pt-4"
        >
          <div className="flex items-end gap-2 overflow-x-auto" style={{ height: 200 }}>
            {trend.map((p) => {
              const h = Math.max(4, Math.round((p.total / trendMax) * 150));
              const isLast = p.year === trendLatest.year;
              return (
                <div
                  key={p.year}
                  className="flex min-w-[30px] flex-1 flex-col items-center gap-1"
                  role="img"
                  aria-label={`${p.year}년 외국인주민 ${p.total.toLocaleString()}명`}
                >
                  <span className="text-[10px] font-semibold text-slate-500">{(p.total / 10000).toFixed(0)}만</span>
                  <div className="flex w-full max-w-[40px] items-end" style={{ height: 150 }}>
                    <div
                      className="w-full rounded-t"
                      style={{ height: h, background: isLast ? "#0f766e" : "#94a3b8" }}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{String(p.year).slice(2)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            행정안전부 「지방자치단체 외국인주민 현황」(매년 11/1 기준) 시도 합계. 2020~21년은 코로나로 일시 감소 후 회복했습니다.
          </p>
        </Panel>
      )}

      {/* 실데이터 시도 기회 점수 (행안부+KEDI) */}
      <RealSidoOpportunityTable />

      <Panel
        title="지역 기회 점수 순위 (표본)"
        subtitle="송금·유학생·급여계좌·다국어 상담 수요를 합산한 종합 기회 점수 — 6개 시군구 시뮬레이션 표본."
        bodyClassName="p-5 pt-3"
      >
        <div className="space-y-2.5">
          {rows.map((row) => {
            const color = scoreColor(row.overallOpportunityScore);
            const width = Math.max(4, Math.round((row.overallOpportunityScore / maxScore) * 100));
            const up = row.yoyChangeRate >= 0;
            return (
              <div
                key={row.id}
                className="surface surface-hover flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3 md:w-auto">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: color }}
                  >
                    {row.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {row.sido} {row.sigungu}
                    </p>
                    <div className="tag-list mt-1">
                      <span className="tag">{row.dominantSegment}</span>
                      <span className="tag">{row.topNationality}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 md:px-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
                    <span>종합 기회 점수</span>
                    <span className="font-mono">
                      거주 {formatNumber(row.residentCount)}명
                    </span>
                  </div>
                  <div className="barlist-track">
                    <div
                      className="barlist-fill"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${color}cc, ${color})`
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 md:w-44 md:justify-end">
                  <span className="text-xl font-bold tabular-nums" style={{ color }}>
                    {formatScore(row.overallOpportunityScore)}
                  </span>
                  <span className={up ? "chip chip-up" : "chip chip-down"}>
                    {up ? "▲" : "▼"} {formatPercent(Math.abs(row.yoyChangeRate))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {hasRealRegionResidents ? (
        <Panel
          title="시군구별 외국인주민 TOP (실데이터)"
          subtitle={`행정안전부 지자체 외국인주민 현황${regionResidentSummary.latestYear ? ` · ${regionResidentSummary.latestYear}년` : ""} · 전체 ${formatNumber(regionResidentSummary.regionCount)}개 시군구`}
          bodyClassName="p-5 pt-3"
        >
          <div className="grid gap-2.5 md:grid-cols-2">
            {regionResidents.slice(0, 12).map((r, i) => {
              const max = regionResidents[0]?.count || 1;
              return (
                <div key={`${r.sido}-${r.sigungu}`} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-xs font-bold text-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-semibold text-ink">{r.sido} {r.sigungu}</span>
                      <span className="shrink-0 font-mono text-muted">{formatNumber(r.count)}명</span>
                    </div>
                    <div className="barlist-track">
                      <div className="barlist-fill" style={{ width: `${Math.max(4, Math.round((r.count / max) * 100))}%`, background: "#3157a4" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}

      <div className="two-column">
        <Panel
          title="점수 유형별 비교 (표본)"
          subtitle="대표 지역 3곳의 송금·유학생·급여계좌·다국어 상담 니즈 구조 — 시뮬레이션 표본."
          right={<span className="eyebrow">표본</span>}
          bodyClassName="p-0"
        >
          <div className="chart-box">
            <ScoreRadarChart />
          </div>
        </Panel>

        <Panel
          title={hasSidoForeignerStats ? "대한민국 시도별 외국인주민 지도" : "대한민국 지역 기회 지도"}
          subtitle={
            hasSidoForeignerStats
              ? "버블 크기·색상 = 시도별 외국인주민 규모 (행안부 실데이터)"
              : "버블 크기는 외국인 수, 색상은 시도 평균 기회 점수(표본)"
          }
          bodyClassName="p-3 pt-2"
        >
          <div className="h-[460px]">
            <RegionMap />
          </div>
        </Panel>
      </div>

      <Panel
        title={`추천 액션 · ${topRegion.sido} ${topRegion.sigungu}`}
        subtitle={`1위 지역 (기회 점수 ${formatScore(topRegion.overallOpportunityScore)} · 대표 세그먼트 ${topRegion.dominantSegment})`}
        bodyClassName="p-5 pt-3"
      >
        <div
          className="rounded-xl border-l-4 bg-slate-50 p-4 text-sm leading-relaxed text-ink"
          style={{ borderColor: scoreColor(topRegion.overallOpportunityScore) }}
        >
          {topRegion.recommendedAction}
        </div>
      </Panel>
    </div>
  );
}
