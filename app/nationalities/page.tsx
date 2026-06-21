import { Flag, Globe, Layers, Users } from "lucide-react";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { BarList } from "@/components/ui/BarList";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import {
  hasNationalityByAge,
  hasRealNationalityData,
  kpiSummary,
  nationalityAgeGroups,
  nationalityAgeTotals,
  nationalityByAge,
  nationalityDistributionData,
} from "@/lib/data/mockData";
import { realForeignResidentStatus } from "@/lib/data/generated/realData";
import type { ForeignResidentStatus } from "@/lib/types/foreignResident";
import { formatNumber } from "@/lib/utils/format";

// 국적별 분포 BarList 항목 — 라벨/거주자 수/비중 서브라벨.
const distributionItems = nationalityDistributionData.map((row) => ({
  label: row.nationality,
  value: row.residents,
  display: formatNumber(row.residents),
  sublabel: `${row.share}%`
}));

const topFifteenTotal = nationalityDistributionData
  .slice(0, 15)
  .reduce((sum, row) => sum + row.residents, 0);

// 실데이터 우선, 없으면 0
const statusRows: readonly ForeignResidentStatus[] = realForeignResidentStatus;
const distinctSegments = new Set(statusRows.map((row) => row.segmentType)).size;

const topNationality = nationalityDistributionData[0];

const statusColumns: DataTableColumn<ForeignResidentStatus>[] = [
  {
    header: "국적",
    accessor: (row) => <span className="font-semibold text-ink">{row.nationality}</span>
  },
  {
    header: "체류자격",
    accessor: (row) => (
      <span className="flex items-center gap-2">
        <span className="chip chip-neutral font-mono">{row.visaCode}</span>
        <span className="text-muted">{row.visaName}</span>
      </span>
    )
  },
  { header: "세그먼트", accessor: (row) => row.segmentType },
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
        title="어느 나라 사람이 얼마나 있는가"
        description="국적별 거주 규모·점유율·연령 구조를 확인합니다. 세그먼트별 금융 니즈 프로파일은 사이드바 → 비자 세그먼트에서 확인하세요."
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

      <Panel
        title="국적별 분포 차트"
        subtitle="거주 규모 상위 국적 비교"
        bodyClassName="p-0"
      >
        <div className="chart-box">
          <NationalityBarChart data={nationalityDistributionData} />
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
            <div className="mt-3 flex items-center gap-4 px-3 pb-1 text-[11px] text-muted">
              {[
                { bg: "#0f766e", fg: "#fff", label: "최고 밀도" },
                { bg: "#5eada4", fg: "#fff", label: "중간" },
                { bg: "#d9f0ee", fg: "#0f4c41", label: "낮음" },
                { bg: "#f8fafc", fg: "#64748b", label: "없음" },
              ].map((s) => (
                <span key={s.label} className="flex items-center gap-1">
                  <span className="inline-block h-3 w-5 rounded text-center text-[9px] leading-3" style={{ background: s.bg, color: s.fg }} />
                  {s.label}
                </span>
              ))}
            </div>
          </Panel>
        );
      })()}

      <Panel
        title="체류자격별 인원 및 금융 니즈"
        subtitle={statusRows.length > 0 ? `법무부 체류외국인 국적·자격별 현황(2024) · 국적별 집계 ${statusRows.length}건` : "체류자격은 금융행동의 직접 증거가 아닌 세그먼트 가설입니다."}
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
