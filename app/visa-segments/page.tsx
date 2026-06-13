import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { FilterBar } from "@/components/layout/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { sampleResidentStatus } from "@/lib/data/mockData";
import { segmentRecommendationMap } from "@/lib/data/insights";
import type {
  ForeignResidentSegment,
  ForeignResidentStatus
} from "@/lib/types/foreignResident";
import { formatNumber } from "@/lib/utils/format";

const columns: DataTableColumn<ForeignResidentStatus>[] = [
  { header: "세그먼트", accessor: (row) => row.segmentType },
  { header: "대표 체류자격", accessor: (row) => `${row.visaCode} ${row.visaName}` },
  { header: "주요 국적", accessor: (row) => row.nationality },
  {
    header: "인원",
    accessor: (row) => `${formatNumber(row.residentCount)}명`,
    align: "right"
  },
  {
    header: "추천 상품",
    accessor: (row) => segmentRecommendationMap[row.segmentType].products.join(", ")
  }
];

const segmentOrder = Object.keys(segmentRecommendationMap) as ForeignResidentSegment[];

export default function VisaSegmentsPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">체류자격 분석</p>
        <h2 className="page-title">체류 목적별 금융 니즈 세그먼트</h2>
        <p className="page-description">
          체류자격을 설명 가능한 룰로 세그먼트화하여 추천 금융상품, 추천 채널,
          리스크 고려사항을 한 화면에서 비교합니다.
        </p>
      </section>

      <FilterBar
        filters={[
          { label: "세그먼트", options: ["전체", ...segmentOrder] },
          { label: "국적", options: ["전체", "중국", "베트남", "몽골", "우즈베키스탄"] },
          { label: "지역", options: ["전체", "서울특별시", "경기도", "충청남도"] }
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {segmentOrder.map((segment) => {
          const item = segmentRecommendationMap[segment];
          return (
            <RecommendationCard
              items={[...item.products, ...item.channels.slice(0, 1)]}
              key={segment}
              note={`리스크: ${item.risks.join(", ")}`}
              title={segment}
            />
          );
        })}
      </section>

      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">세그먼트별 체류자격 매핑</h3>
            <p className="surface-subtitle">개인 추론이 아닌 집계 단위 분류 가설로만 사용합니다.</p>
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={columns} rowKey={(row) => row.id} rows={sampleResidentStatus} />
        </div>
      </section>
    </>
  );
}
