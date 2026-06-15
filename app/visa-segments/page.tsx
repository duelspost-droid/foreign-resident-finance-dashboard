import { CreditCard, Layers, Users, Wallet } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import { segmentRecommendationMap } from "@/lib/data/insights";
import { sampleResidentStatus } from "@/lib/data/mockData";
import type {
  ForeignResidentSegment,
  ForeignResidentStatus
} from "@/lib/types/foreignResident";
import { formatNumber } from "@/lib/utils/format";

const ACCENTS = ["#0f766e", "#3157a4", "#b45309", "#be123c"] as const;

const segmentOrder = Object.keys(
  segmentRecommendationMap
) as ForeignResidentSegment[];

// 세그먼트별 인원 집계 (sampleResidentStatus의 residentCount를 segmentType 기준으로 합산).
const countBySegment = sampleResidentStatus.reduce<Record<string, number>>(
  (acc, row) => {
    acc[row.segmentType] = (acc[row.segmentType] ?? 0) + row.residentCount;
    return acc;
  },
  {}
);

// 세그먼트별 대표 체류자격·주요 국적: 인원이 가장 많은 행을 채택.
const representativeBySegment = sampleResidentStatus.reduce<
  Record<string, ForeignResidentStatus>
>((acc, row) => {
  const current = acc[row.segmentType];
  if (!current || row.residentCount > current.residentCount) {
    acc[row.segmentType] = row;
  }
  return acc;
}, {});

const totalAnalyzed = sampleResidentStatus.reduce(
  (sum, row) => sum + row.residentCount,
  0
);

const topSegment = Object.entries(countBySegment).sort(
  (a, b) => b[1] - a[1]
)[0];

const distinctProducts = Array.from(
  new Set(
    segmentOrder.flatMap((segment) => segmentRecommendationMap[segment].products)
  )
);

// 매트릭스 컬럼: 전 세그먼트 추천상품의 합집합을 빈도순으로 정렬 후 상위 8개로 제한.
const productFrequency = segmentOrder
  .flatMap((segment) => segmentRecommendationMap[segment].products)
  .reduce<Record<string, number>>((acc, product) => {
    acc[product] = (acc[product] ?? 0) + 1;
    return acc;
  }, {});

const matrixProducts = Array.from(new Set(distinctProducts))
  .sort((a, b) => productFrequency[b] - productFrequency[a])
  .slice(0, 8);

// 데이터테이블: 대표 행이 있는 세그먼트만 (집계 분류 가설).
const mappedRows = segmentOrder
  .map((segment) => representativeBySegment[segment])
  .filter((row): row is ForeignResidentStatus => Boolean(row));

const columns: DataTableColumn<ForeignResidentStatus>[] = [
  { header: "세그먼트", accessor: (row) => row.segmentType },
  {
    header: "대표 체류자격",
    accessor: (row) => `${row.visaCode ?? ""} ${row.visaName ?? ""}`.trim()
  },
  { header: "주요 국적", accessor: (row) => row.nationality },
  {
    header: "인원",
    accessor: (row) => `${formatNumber(countBySegment[row.segmentType] ?? 0)}명`,
    align: "right"
  },
  {
    header: "추천 상품",
    accessor: (row) =>
      segmentRecommendationMap[row.segmentType].products.join(", ")
  }
];

export default function VisaSegmentsPage() {
  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="체류자격 분석"
        title="체류 목적별 금융 니즈 세그먼트"
        description="체류자격을 설명 가능한 룰로 세그먼트화하여 추천 금융상품, 추천 채널, 리스크 고려사항을 한 화면에서 비교합니다. 모든 수치는 집계 단위 통계로만 제공됩니다."
      />

      <div className="stat-grid">
        <StatTile
          accent="#0f766e"
          icon={<Layers size={18} />}
          label="세그먼트 수"
          sub="설명 가능 분류 룰"
          unit="개"
          value={formatNumber(segmentOrder.length)}
        />
        <StatTile
          accent="#3157a4"
          icon={<Users size={18} />}
          label="최대 인원 세그먼트"
          sub={topSegment ? `${formatNumber(topSegment[1])}명` : "데이터 없음"}
          value={topSegment ? topSegment[0] : "—"}
        />
        <StatTile
          accent="#b45309"
          icon={<Wallet size={18} />}
          label="총 분석 인원"
          sub="sampleResidentStatus 합계"
          unit="명"
          value={formatNumber(totalAnalyzed)}
        />
        <StatTile
          accent="#be123c"
          icon={<CreditCard size={18} />}
          label="추천 상품 종류"
          sub="전 세그먼트 고유 상품"
          unit="종"
          value={formatNumber(distinctProducts.length)}
        />
      </div>

      <section>
        <p className="eyebrow mb-3">세그먼트 프로파일</p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {segmentOrder.map((segment, index) => {
            const item = segmentRecommendationMap[segment];
            const accent = ACCENTS[index % ACCENTS.length];
            const count = countBySegment[segment] ?? 0;
            return (
              <article
                className="surface surface-hover flex flex-col overflow-hidden"
                key={segment}
              >
                <div
                  className="px-4 py-3"
                  style={{
                    background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`
                  }}
                >
                  <h3 className="text-base font-bold leading-tight text-white">
                    {segment}
                  </h3>
                  <div className="mt-1 flex items-baseline gap-1 text-white/90">
                    <span className="text-xl font-extrabold tracking-tight">
                      {formatNumber(count)}
                    </span>
                    <span className="text-xs">명</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                      추천 상품
                    </p>
                    <div className="tag-list">
                      {item.products.map((product) => (
                        <span className="tag" key={product}>
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
                      추천 채널
                    </p>
                    <p className="text-xs leading-relaxed text-slate-600">
                      {item.channels.join(" · ")}
                    </p>
                  </div>
                  <p
                    className="mt-auto rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-muted"
                    style={{ borderLeft: `3px solid ${accent}` }}
                  >
                    <span className="font-semibold text-slate-500">리스크</span>{" "}
                    {item.risks.join(", ")}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Panel
        subtitle="행 = 세그먼트, 열 = 추천 빈도 상위 상품. 진한 셀은 해당 세그먼트가 그 상품을 추천 대상으로 포함함을 의미합니다."
        title="세그먼트 × 추천상품 매트릭스"
      >
        <div className="table-scroll">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="text-slate-600">
                <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left text-xs font-semibold">
                  세그먼트
                </th>
                {matrixProducts.map((product) => (
                  <th
                    className="px-2 py-2 text-center align-bottom text-[11px] font-semibold"
                    key={product}
                  >
                    {product}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {segmentOrder.map((segment) => {
                const products = segmentRecommendationMap[segment].products;
                return (
                  <tr key={segment}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-3 py-2 text-left text-xs font-semibold text-ink">
                      {segment}
                    </td>
                    {matrixProducts.map((product) => {
                      const active = products.includes(product);
                      return (
                        <td className="px-1.5 py-1.5" key={product}>
                          <div
                            className="mx-auto flex h-8 w-full items-center justify-center rounded-md text-[10px] font-bold transition-colors"
                            style={
                              active
                                ? {
                                    background: "#0f766e",
                                    color: "#ffffff"
                                  }
                                : {
                                    background: "#f1f5f9",
                                    color: "#cbd5e1"
                                  }
                            }
                            title={`${segment} · ${product}`}
                          >
                            {active ? "●" : "·"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-4 px-1 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded"
              style={{ background: "#0f766e" }}
            />
            추천 포함
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded"
              style={{ background: "#f1f5f9" }}
            />
            미포함
          </span>
        </div>
      </Panel>

      <Panel
        subtitle="개인 추론이 아닌 집계 단위 분류 가설로만 사용합니다. 대표 체류자격·주요 국적은 세그먼트 내 최대 인원 행 기준입니다."
        title="세그먼트별 체류자격 매핑"
      >
        <DataTable
          columns={columns}
          rowKey={(row) => row.id}
          rows={mappedRows}
        />
      </Panel>
    </div>
  );
}
