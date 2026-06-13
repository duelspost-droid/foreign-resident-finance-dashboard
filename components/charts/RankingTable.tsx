import type { RegionOpportunityRow } from "@/lib/types/foreignResident";
import { formatNumber, formatPercent, formatScore } from "@/lib/utils/format";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";

const columns: DataTableColumn<RegionOpportunityRow>[] = [
  { header: "순위", accessor: (row) => row.rank, align: "center" },
  {
    header: "지역",
    accessor: (row) => `${row.sido} ${row.sigungu}`
  },
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
    header: "전체",
    accessor: (row) => (
      <span className="font-bold text-teal-800">
        {formatScore(row.overallOpportunityScore)}
      </span>
    ),
    align: "right"
  }
];

export function RankingTable({ rows }: { rows: RegionOpportunityRow[] }) {
  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />;
}
