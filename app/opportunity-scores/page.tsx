import { BarChart3, Gauge, Trophy, TrendingUp } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { Panel } from "@/components/ui/Panel";
import { PageHero } from "@/components/ui/PageHero";
import { StatTile } from "@/components/ui/StatTile";
import { sampleOpportunityRows } from "@/lib/data/mockData";
import type { RegionOpportunityRow } from "@/lib/types/foreignResident";
import {
  formatNumber,
  formatPercent,
  formatScore,
  scoreColor as tierColor,
  scoreTierLabel as tierLabel
} from "@/lib/utils/format";

// 리더보드 카드의 4개 미니 지표 — 각각 고유 색상.
const METRIC_BARS: {
  label: string;
  key: keyof Pick<
    RegionOpportunityRow,
    "remittanceNeedScore" | "studentFinanceScore" | "payrollNeedScore" | "multilingualCsScore"
  >;
  color: string;
}[] = [
  { label: "송금", key: "remittanceNeedScore", color: "#0f766e" },
  { label: "유학생", key: "studentFinanceScore", color: "#3157a4" },
  { label: "급여계좌", key: "payrollNeedScore", color: "#b45309" },
  { label: "다국어", key: "multilingualCsScore", color: "#be123c" }
];

const columns: DataTableColumn<RegionOpportunityRow>[] = [
  { header: "순위", accessor: (row) => row.rank, align: "center" },
  { header: "시도", accessor: (row) => row.sido },
  { header: "시군구", accessor: (row) => row.sigungu },
  { header: "주요 국적", accessor: (row) => row.topNationality },
  { header: "주요 세그먼트", accessor: (row) => row.dominantSegment },
  {
    header: "외국인 수",
    accessor: (row) => `${formatNumber(row.residentCount)}명`,
    align: "right"
  },
  {
    header: "성장률",
    accessor: (row) => formatPercent(row.yoyChangeRate),
    align: "right"
  },
  {
    header: "송금",
    accessor: (row) => formatScore(row.remittanceNeedScore),
    align: "right"
  },
  {
    header: "유학생",
    accessor: (row) => formatScore(row.studentFinanceScore),
    align: "right"
  },
  {
    header: "급여계좌",
    accessor: (row) => formatScore(row.payrollNeedScore),
    align: "right"
  },
  {
    header: "다국어",
    accessor: (row) => formatScore(row.multilingualCsScore),
    align: "right"
  },
  {
    header: "전체",
    accessor: (row) => (
      <span className="font-bold" style={{ color: tierColor(row.overallOpportunityScore) }}>
        {formatScore(row.overallOpportunityScore)}
      </span>
    ),
    align: "right"
  },
  { header: "추천 액션", accessor: (row) => row.recommendedAction }
];

export default function OpportunityScoresPage() {
  const rows = [...sampleOpportunityRows].sort(
    (a, b) => b.overallOpportunityScore - a.overallOpportunityScore
  );

  const regionCount = rows.length;
  const averageScore =
    regionCount > 0
      ? rows.reduce((sum, row) => sum + row.overallOpportunityScore, 0) / regionCount
      : 0;
  const topScoreRow = rows[0];
  const topGrowthRow = rows.reduce(
    (best, row) => (row.yoyChangeRate > best.yoyChangeRate ? row : best),
    rows[0]
  );

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="금융 기회 점수"
        title="전략 실행 우선순위 랭킹"
        description="외국인 규모, 송금 수요, 유학생 수요, 급여계좌 수요, 다국어 상담 필요도를 0~100으로 정규화하고 설명 가능한 가중치로 전체 기회 점수를 산출합니다."
      />

      {/* 표본 안내: 현재 리더보드는 시뮬레이션 표본 기반 */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs leading-5 text-amber-800">
        <span className="rounded bg-amber-200 px-1.5 py-0.5 font-bold">표본</span>
        <span>
          이 리더보드의 점수·순위는 6개 시군구 <strong>시뮬레이션 표본</strong>으로 산출된 값입니다.
          실 집계(KOSIS 시군구 23,477행) 기반 점수 산출은 후속 단계로 연동 예정입니다.
        </span>
      </div>

      <div className="stat-grid">
        <StatTile
          label="분석 지역 수"
          value={formatNumber(regionCount)}
          unit="개 지역"
          accent="#0f766e"
          icon={<BarChart3 size={18} />}
          sub="시군구 단위 집계"
        />
        <StatTile
          label="평균 전체 기회점수"
          value={formatScore(averageScore)}
          unit="/ 100"
          accent="#3157a4"
          icon={<Gauge size={18} />}
          sub="가중 합성 점수 평균"
        />
        <StatTile
          label="최고 점수 지역"
          value={formatScore(topScoreRow.overallOpportunityScore)}
          unit="점"
          accent="#b45309"
          icon={<Trophy size={18} />}
          trend={{ label: `${topScoreRow.sido} ${topScoreRow.sigungu}`, dir: "up" }}
        />
        <StatTile
          label="최고 성장 지역"
          value={formatPercent(topGrowthRow.yoyChangeRate)}
          accent="#be123c"
          icon={<TrendingUp size={18} />}
          trend={{ label: `${topGrowthRow.sido} ${topGrowthRow.sigungu}`, dir: "up" }}
          sub="전년 대비 외국인 증가율"
        />
      </div>

      <Panel
        title="지역 기회 점수 리더보드"
        subtitle="전체 기회 점수 내림차순 — 색상은 점수 티어(최우선·우선·관찰·후순위)를 나타냅니다."
      >
        <div className="space-y-3">
          {rows.map((row) => {
            const accent = tierColor(row.overallOpportunityScore);
            const overallPct = Math.max(2, Math.min(100, row.overallOpportunityScore));
            return (
              <div
                key={row.id}
                className="surface surface-hover p-4"
                style={{ borderLeft: `4px solid ${accent}` }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  {/* 좌측: 랭크 배지 + 지역 + 태그 */}
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white"
                        style={{ background: accent }}
                      >
                        {row.rank}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: accent }}
                      >
                        {tierLabel(row.overallOpportunityScore)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-ink">
                        {row.sido} {row.sigungu}
                      </p>
                      <div className="tag-list mt-1.5">
                        <span className="tag">{row.dominantSegment}</span>
                        <span className="tag">주요 국적 · {row.topNationality}</span>
                        <span className="tag">{formatNumber(row.residentCount)}명</span>
                        <span className="tag">YoY {formatPercent(row.yoyChangeRate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 중앙: 큰 전체 점수 + 점수 바 */}
                  <div className="lg:w-72 lg:shrink-0">
                    <div className="mb-1 flex items-end justify-between gap-2">
                      <span className="eyebrow">전체 기회 점수</span>
                      <span
                        className="font-mono text-2xl font-extrabold leading-none"
                        style={{ color: accent }}
                      >
                        {formatScore(row.overallOpportunityScore)}
                      </span>
                    </div>
                    <div className="barlist-track" style={{ height: "10px" }}>
                      <div
                        className="barlist-fill"
                        style={{ width: `${overallPct}%`, background: accent }}
                      />
                    </div>
                  </div>

                  {/* 우측: 4개 미니 지표 바 */}
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2 lg:w-80 lg:shrink-0">
                    {METRIC_BARS.map((metric) => {
                      const value = row[metric.key];
                      const pct = Math.max(2, Math.min(100, value));
                      return (
                        <div key={metric.key}>
                          <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-semibold text-muted">{metric.label}</span>
                            <span className="font-mono font-bold" style={{ color: metric.color }}>
                              {formatScore(value)}
                            </span>
                          </div>
                          <div className="barlist-track" style={{ height: "6px" }}>
                            <div
                              className="barlist-fill"
                              style={{ width: `${pct}%`, background: metric.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

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

      <Panel
        title="지역별 금융 기회 점수 상세"
        subtitle="순위·지역·국적·세그먼트·규모·성장률과 세부 점수, 전체 점수, 추천 액션을 한눈에 비교합니다."
        bodyClassName="p-2"
      >
        <DataTable columns={columns} rowKey={(row) => row.id} rows={rows} />
      </Panel>
    </div>
  );
}
