import { CreditCard, Layers, Users, Wallet } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import { segmentRecommendationMap } from "@/lib/data/insights";
import { hasRealVisaData, stayVisaTypes } from "@/lib/data/mockData";
import type { ForeignResidentSegment } from "@/lib/types/foreignResident";
import { formatNumber } from "@/lib/utils/format";

const ACCENTS = ["#0f766e", "#3157a4", "#b45309", "#be123c"] as const;

const segmentOrder = Object.keys(
  segmentRecommendationMap
) as ForeignResidentSegment[];

// 세그먼트별 인원 집계: stayVisaTypes(실데이터) 우선, 없으면 0.
const countBySegment = stayVisaTypes.reduce<Record<string, number>>(
  (acc, row) => {
    acc[row.segment] = (acc[row.segment] ?? 0) + row.count;
    return acc;
  },
  {}
);

// 세그먼트별 대표 체류자격: stayVisaTypes(실 비자데이터)에서 세그먼트별 최다 인원 비자.
// (realForeignResidentStatus는 국적 기준 소스라 segmentType이 전부 '기타'·visaCode 공백 → 매핑 표에 부적합)
type SegmentMapRow = {
  segment: ForeignResidentSegment;
  visaLabel: string;
  count: number;
};

const representativeVisaBySegment = stayVisaTypes.reduce<
  Record<string, (typeof stayVisaTypes)[number]>
>((acc, v) => {
  const current = acc[v.segment];
  if (!current || v.count > current.count) acc[v.segment] = v;
  return acc;
}, {});

const totalAnalyzed = stayVisaTypes.reduce((sum, row) => sum + row.count, 0);

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

// 데이터테이블: 세그먼트별 대표 비자·인원(실데이터 기준). 인원 있는 세그먼트만.
const mappedRows: SegmentMapRow[] = segmentOrder
  .map((segment) => {
    const visa = representativeVisaBySegment[segment];
    return {
      segment,
      visaLabel: visa ? `${visa.visaCode} ${visa.visaName}`.trim() : "—",
      count: countBySegment[segment] ?? 0
    };
  })
  .filter((row) => row.count > 0)
  .sort((a, b) => b.count - a.count);

const columns: DataTableColumn<SegmentMapRow>[] = [
  { header: "세그먼트", accessor: (row) => row.segment },
  { header: "대표 체류자격", accessor: (row) => row.visaLabel },
  {
    header: "인원",
    accessor: (row) => `${formatNumber(row.count)}명`,
    align: "right"
  },
  {
    header: "추천 상품",
    accessor: (row) => segmentRecommendationMap[row.segment].products.join(", ")
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
          sub={hasRealVisaData ? "법무부 외국인체류데이터(2024) 실데이터" : "샘플 합계"}
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

      {hasRealVisaData && stayVisaTypes.length > 0 && (
        <Panel
          title="체류자격별 인원 (실데이터)"
          subtitle="법무부 외국인체류데이터(2024) · 장기체류 비자타입별 인원 · 상위 20개"
          right={<span className="eyebrow">{stayVisaTypes.length}종</span>}
          bodyClassName="p-4 pt-3"
        >
          <div className="space-y-2">
            {stayVisaTypes.map((v, i) => {
              const max = stayVisaTypes[0]?.count ?? 1;
              const pct = Math.max(3, Math.round((v.count / max) * 100));
              const segColors: Record<string, string> = {
                "비전문취업 근로자": "#0f766e",
                "재외동포": "#3157a4",
                "유학생": "#b45309",
                "결혼이민": "#be123c",
                "어학연수생": "#7c3aed",
                "전문인력": "#0369a1",
                "단기체류": "#64748b",
                "기타": "#94a3b8"
              };
              const barColor = segColors[v.segment] ?? "#94a3b8";
              return (
                <div key={v.visaCode} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-xs font-bold text-muted">{i + 1}</span>
                  <span className="w-14 shrink-0 text-[11px] font-mono font-bold" style={{ color: barColor }}>
                    {v.visaCode}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-ink">{v.visaName}</span>
                      <span className="shrink-0 font-mono text-muted">{formatNumber(v.count)}명</span>
                    </div>
                    <div className="barlist-track">
                      <div className="barlist-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] text-muted">{v.segment}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel
        subtitle={hasRealVisaData ? "법무부 외국인체류데이터(2024) 장기체류 비자타입별 집계 · 개인 추론 금지" : "개인 추론이 아닌 집계 단위 분류 가설로만 사용합니다."}
        title="세그먼트별 체류자격 매핑"
        right={hasRealVisaData ? <span className="chip chip-up">실데이터 연동</span> : undefined}
      >
        <DataTable
          columns={columns}
          rowKey={(row) => row.segment}
          rows={mappedRows}
        />
      </Panel>
    </div>
  );
}
