import { FilterBar } from "@/components/layout/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { sampleOpportunityRows } from "@/lib/data/mockData";
import type { RegionOpportunityRow } from "@/lib/types/foreignResident";
import { formatNumber, formatPercent, formatScore } from "@/lib/utils/format";

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
      <span className="font-bold text-teal-800">
        {formatScore(row.overallOpportunityScore)}
      </span>
    ),
    align: "right"
  },
  { header: "추천 액션", accessor: (row) => row.recommendedAction }
];

export default function OpportunityScoresPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">금융 기회 점수</p>
        <h2 className="page-title">전략 실행 우선순위 랭킹</h2>
        <p className="page-description">
          외국인 규모, 송금 수요, 유학생 수요, 급여계좌 수요, 다국어 상담 필요도를 0~100으로
          정규화하고 설명 가능한 가중치로 전체 기회 점수를 산출합니다.
        </p>
      </section>

      <FilterBar
        filters={[
          { label: "점수 유형", options: ["전체 기회", "송금", "유학생", "급여계좌", "다국어"] },
          { label: "기준월", options: ["2025.12", "2025.11", "2025.10"] },
          { label: "지역", options: ["전체", "서울특별시", "경기도", "충청남도", "부산광역시"] },
          { label: "세그먼트", options: ["전체", "유학생", "비전문취업 근로자", "재외동포"] }
        ]}
      />

      <section className="surface">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">지역별 금융 기회 점수 랭킹</h3>
            <p className="surface-subtitle">
              내부 금융 데이터가 없을 때는 체류자격·국적 집중도·성장률로 대체 점수를 산출합니다.
            </p>
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={columns} rowKey={(row) => row.id} rows={sampleOpportunityRows} />
        </div>
      </section>
    </>
  );
}
