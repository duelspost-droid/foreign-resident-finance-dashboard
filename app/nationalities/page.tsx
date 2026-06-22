import { Flag, Globe, Layers, Users } from "lucide-react";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { VisaDonutChart } from "@/components/charts/VisaDonutChart";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { BarList } from "@/components/ui/BarList";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import {
  hasNationalityByAge,
  hasRealNationalityData,
  hasRealVisaData,
  kpiSummary,
  nationalityAgeGroups,
  nationalityAgeTotals,
  nationalityByAge,
  nationalityDistributionData,
  visaDistributionData
} from "@/lib/data/mockData";
import { realForeignResidentStatus } from "@/lib/data/generated/realData";
import type { ForeignResidentStatus } from "@/lib/types/foreignResident";
import { DONUT_PALETTE } from "@/lib/theme/chartPalette";
import { formatNumber } from "@/lib/utils/format";

// 국적별 분포 BarList 항목 — 라벨/거주자 수/비중 서브라벨.
const distributionItems = nationalityDistributionData.map((row) => ({
  label: row.nationality,
  value: row.residents,
  display: formatNumber(row.residents),
  sublabel: `${row.share}%`
}));

// 체류자격 도넛 차트와 동일한 팔레트(레전드용) — 단일출처.
const donutColors = DONUT_PALETTE;
const donutLegend = visaDistributionData.map((segment, index) => ({
  name: segment.name,
  value: segment.value,
  color: donutColors[index % donutColors.length]
}));

const topFifteenTotal = nationalityDistributionData
  .slice(0, 15)
  .reduce((sum, row) => sum + row.residents, 0);

// 국적별 집계(실데이터). 인원 내림차순으로 정렬해 상위 국적부터 표시.
const statusRows: readonly ForeignResidentStatus[] = [...realForeignResidentStatus].sort(
  (a, b) => b.residentCount - a.residentCount
);
// 세그먼트 수: 국적 소스의 segmentType은 전부 '기타'라 무의미 → 도넛에 표시되는 체류자격 세그먼트 수를 사용.
const distinctSegments = visaDistributionData.length;

const topNationality = nationalityDistributionData[0];

// 국적 소스는 체류자격(visaCode/visaName 공백)·세그먼트(전부 '기타') 정보가 없어 해당 컬럼 제외.
const statusColumns: DataTableColumn<ForeignResidentStatus>[] = [
  {
    header: "국적",
    accessor: (row) => <span className="font-semibold text-ink">{row.nationality}</span>
  },
  {
    header: "인원",
    accessor: (row) => `${formatNumber(row.residentCount)}명`,
    align: "right"
  },
  {
    header: "금융 니즈",
    accessor: (row) => (
      <span className="tag-list">
        {row.financialNeedTags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </span>
    )
  }
];

export default function NationalitiesPage() {
  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="국적 분석"
        title="국적별 체류 구조와 금융 니즈"
        description="국적별 거주 규모와 체류자격 구성, 월별 증가 추세를 비교하고 계좌개설·송금·체크카드·자산관리 같은 니즈 태그를 한눈에 확인합니다."
        right={
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white">
            <Flag aria-hidden size={18} />
            <div className="leading-tight">
              <p className="text-lg font-bold">{formatNumber(kpiSummary.totalResidents)}</p>
              <p className="text-[11px] text-white/75">
                {hasRealNationalityData ? "실데이터 · 법무부 2024" : "샘플 데이터"} · 총 체류외국인
              </p>
            </div>
          </div>
        }
      />

      <div className="stat-grid">
        <StatTile
          label={hasRealNationalityData ? "집계 국적 수" : "분석 국적 수"}
          value={hasRealNationalityData ? 205 : nationalityDistributionData.length}
          unit="개국"
          icon={<Flag size={18} />}
          accent="#0f766e"
          sub={hasRealNationalityData ? "법무부 국적별 현황 실데이터" : "국적별 분포 데이터 기준"}
        />
        <StatTile
          label="1위 국적"
          value={topNationality.nationality}
          icon={<Globe size={18} />}
          accent="#3157a4"
          trend={{ label: `점유 ${topNationality.share}%`, dir: "up" }}
          sub={`${formatNumber(topNationality.residents)}명`}
        />
        <StatTile
          label="상위 15개국 합계"
          value={formatNumber(topFifteenTotal)}
          unit="명"
          icon={<Users size={18} />}
          accent="#b45309"
          sub={hasRealNationalityData ? "전체 체류외국인의 상위 15개국" : "국적별 분포 상위 15개국 합산"}
        />
        <StatTile
          label="세그먼트 수"
          value={distinctSegments}
          unit="종"
          icon={<Layers size={18} />}
          accent="#be123c"
          sub="체류자격 기반 세그먼트 가설"
        />
      </div>

      <Panel
        title="국적별 분포"
        subtitle={hasRealNationalityData ? "법무부 체류외국인 국적별 현황(2024) · 상위 15개국" : "상위 국적의 샘플 거주자 수와 점유율"}
        right={<span className="eyebrow">{hasRealNationalityData ? "실데이터" : "샘플"} · 단위 명</span>}
      >
        <BarList items={distributionItems} unit="명" />
      </Panel>

      <div className="two-column">
        <Panel
          title="국적별 분포 차트"
          subtitle="거주 규모 상위 국적 비교"
          bodyClassName="p-0"
        >
          <div className="chart-box">
            <NationalityBarChart data={nationalityDistributionData} />
          </div>
        </Panel>

        <Panel
          title="체류자격 구성"
          subtitle={hasRealVisaData ? "법무부 외국인체류데이터(2024) · 장기체류 기준 세그먼트 분포" : "세그먼트별 비중 샘플"}
          bodyClassName="p-0"
        >
          <div className="chart-box">
            <VisaDonutChart />
          </div>
          <div className="border-t border-line px-5 py-4">
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
              {donutLegend.map((segment) => (
                <li className="flex items-center justify-between gap-2" key={segment.name}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: segment.color }}
                    />
                    <span className="truncate text-ink">{segment.name}</span>
                  </span>
                  <span className="shrink-0 font-mono font-semibold text-muted">
                    {segment.value}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel
        title="월별 증가 추세"
        subtitle="주요 국적 체류외국인 월별 추세 · 추세 패턴 예시(표본)"
        right={<span className="eyebrow">표본 · 실수치 아님</span>}
        bodyClassName="p-0"
      >
        <div className="chart-box">
          <TrendLineChart />
        </div>
      </Panel>

      {hasNationalityByAge && (() => {
        const TOP = nationalityAgeTotals.slice(0, 10);
        // 전체 최대값(히트맵 색상 기준 — 국적 간 절대 비교)
        const absMax = Math.max(
          ...TOP.flatMap(({ nationality }) =>
            nationalityAgeGroups.map((ag) => {
              const item = nationalityByAge.find((i) => i.nationality === nationality && i.ageGroup === ag);
              return item?.count ?? 0;
            })
          ),
          1
        );
        function cellBg(count: number): string {
          if (count === 0) return "#f8fafc";
          const t = count / absMax;
          if (t >= 0.75) return "#0f766e";
          if (t >= 0.5)  return "#1a9c90";
          if (t >= 0.3)  return "#5eada4";
          if (t >= 0.15) return "#a8d8d4";
          return "#d9f0ee";
        }
        function cellFg(count: number): string {
          const t = count / absMax;
          return t >= 0.5 ? "#ffffff" : "#0f4c41";
        }
        return (
          <Panel
            title="국적별 연령대 히트맵"
            subtitle="행안부 외국인주민 국적×연령대 현황 · 색상 강도 = 해당 셀 인원 규모 (절대값 기준)"
            right={<span className="eyebrow">실데이터 · {nationalityAgeTotals.length}개 국적</span>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-[11px] font-bold text-muted">국적</th>
                    {nationalityAgeGroups.map((ag) => (
                      <th key={ag} className="px-1 py-2 text-center text-[11px] font-semibold text-muted">
                        {ag.replace("세", "")}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right text-[11px] font-bold text-muted">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP.map(({ nationality, total }) => {
                    const ageRow = nationalityAgeGroups.map((ag) => {
                      const item = nationalityByAge.find((i) => i.nationality === nationality && i.ageGroup === ag);
                      return item?.count ?? 0;
                    });
                    return (
                      <tr key={nationality} className="border-t border-slate-100">
                        <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-1.5 font-semibold text-ink">
                          {nationality}
                        </td>
                        {ageRow.map((count, ci) => (
                          <td key={nationalityAgeGroups[ci]} className="px-0.5 py-0.5 text-center">
                            <div
                              className="mx-auto flex h-8 min-w-[32px] items-center justify-center rounded text-[10px] font-semibold transition-colors"
                              style={{ background: cellBg(count), color: cellFg(count) }}
                              title={`${nationality} · ${nationalityAgeGroups[ci]}: ${formatNumber(count)}명`}
                            >
                              {count > 0 ? (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count) : "·"}
                            </div>
                          </td>
                        ))}
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-ink">
                          {formatNumber(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pb-1 text-[11px] text-muted">
              {[
                { bg: "#0f766e", fg: "#fff", label: "최고 밀도" },
                { bg: "#5eada4", fg: "#fff", label: "중간" },
                { bg: "#d9f0ee", fg: "#0f4c41", label: "낮음" },
                { bg: "#f8fafc", fg: "#64748b", label: "없음" },
              ].map((s) => (
                <span key={s.label} className="flex items-center gap-1 whitespace-nowrap">
                  <span className="inline-block h-3 w-5 rounded text-center text-[9px] leading-3" style={{ background: s.bg, color: s.fg }} />
                  {s.label}
                </span>
              ))}
            </div>
          </Panel>
        );
      })()}

      <Panel
        title="국적별 인원 및 금융 니즈"
        subtitle={statusRows.length > 0 ? `법무부 체류외국인 국적별 현황(2024) · 국적별 집계 ${statusRows.length}건` : "국적별 집계 데이터가 아직 없습니다."}
        right={<span className="chip chip-neutral">{statusRows.length > 0 ? "실데이터" : "가설 기반"}</span>}
        bodyClassName="p-2"
      >
        <DataTable
          columns={statusColumns}
          rowKey={(row) => row.id}
          rows={statusRows.slice(0, 100)}
        />
      </Panel>
    </div>
  );
}
