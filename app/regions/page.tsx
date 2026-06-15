import { Gauge, MapPin, TrendingUp, Trophy } from "lucide-react";

import { RegionMap } from "@/components/charts/RegionMap";
import { ScoreRadarChart } from "@/components/charts/ScoreRadarChart";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import { sampleOpportunityRows } from "@/lib/data/mockData";
import { formatNumber, formatPercent, formatScore } from "@/lib/utils/format";

// 점수 구간별 브랜드 컬러 — 랭킹 원형 배지와 타일 색상에 공통 사용.
function scoreColor(score: number): string {
  if (score >= 72) return "#0f766e"; // teal
  if (score >= 55) return "#3157a4"; // cobalt
  if (score >= 40) return "#b45309"; // amber
  return "#be123c"; // berry
}

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

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="지역 분석"
        title="지역별 외국인 분포와 금융 기회"
        description="시도·시군구 단위의 집계 데이터를 기준으로 외국인 밀집도, 세그먼트, 송금·유학생·급여계좌 수요를 비교해 우선 공략 지역을 도출합니다."
      />

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

      <Panel
        title="지역 기회 점수 순위"
        subtitle="송금·유학생·급여계좌·다국어 상담 수요를 합산한 종합 기회 점수 순위입니다."
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

      <div className="two-column">
        <Panel
          title="점수 유형별 비교"
          subtitle="대표 지역 3곳의 송금·유학생·급여계좌·다국어 상담 니즈 구조"
          bodyClassName="p-0"
        >
          <div className="chart-box">
            <ScoreRadarChart />
          </div>
        </Panel>

        <Panel
          title="대한민국 지역 기회 지도"
          subtitle="버블 크기는 외국인 수, 색상은 시도 평균 기회 점수"
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
