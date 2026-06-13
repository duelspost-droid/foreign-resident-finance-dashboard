import { ExternalLink } from "lucide-react";
import { dataSources } from "@/lib/data/dataSources";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import type { DataSourceItem } from "@/lib/data/dataSources";

const columns: DataTableColumn<DataSourceItem>[] = [
  { header: "데이터명", accessor: (row) => row.name },
  { header: "제공기관", accessor: (row) => row.provider },
  { header: "갱신주기", accessor: (row) => row.refreshCycle },
  {
    header: "주요 컬럼",
    accessor: (row) => (
      <span className="tag-list">
        {row.keyColumns.slice(0, 4).map((column) => (
          <span className="tag" key={column}>
            {column}
          </span>
        ))}
      </span>
    )
  },
  { header: "한계", accessor: (row) => row.limitation }
];

export default function DataSourcesPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">데이터 소스</p>
        <h2 className="page-title">출처와 한계 관리</h2>
        <p className="page-description">
          대시보드의 모든 분석은 공개 통계 또는 집계 데이터 기준입니다. 각 출처의 기준,
          갱신주기, 한계를 함께 표시해 과잉 해석을 줄입니다.
        </p>
      </section>

      <section className="surface">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">데이터 출처 목록</h3>
            <p className="surface-subtitle">법무부, 행정안전부, 교육부, 대학알리미, 내부 집계 샘플</p>
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={columns} rowKey={(row) => row.name} rows={dataSources} />
        </div>
      </section>

      <section className="grid gap-4 pt-4 md:grid-cols-2">
        {dataSources.map((source) => (
          <article className="surface p-4" key={source.name}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink">{source.name}</h3>
                <p className="mt-1 text-sm text-muted">{source.provider}</p>
              </div>
              <ExternalLink aria-hidden className="text-slate-400" size={18} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{source.usage}</p>
            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              한계: {source.limitation}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
