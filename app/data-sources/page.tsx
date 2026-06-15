import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { dataSources } from "@/lib/data/dataSources";
import { dataLineage } from "@/lib/data/generated/dataLineage";
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
  const { totals } = dataLineage;

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">데이터 소스</p>
        <h2 className="page-title">출처 정의와 활용 한계</h2>
        <p className="page-description">
          대시보드의 모든 분석은 공개 통계 또는 집계 데이터 기준입니다. 각 출처의 기준, 갱신주기,
          주요 컬럼과 활용 한계를 큐레이션해 기록합니다. 실시간 수집 상태와 요청 이력은 수집
          파이프라인 화면에서 관리합니다.
        </p>
      </section>

      {/* 수집 파이프라인 바로가기 */}
      <Link
        href="/data-pipeline"
        className="surface flex items-center justify-between gap-3 px-4 py-3 transition hover:border-teal-300"
      >
        <div>
          <p className="text-sm font-semibold text-ink">수집 파이프라인 관리 →</p>
          <p className="text-xs text-muted">
            등록 출처 {totals.sources}개 · 수집 성공 {totals.downloaded} · 실패 {totals.failed} ·
            요청 URL/발굴 후보/키 상태 확인
          </p>
        </div>
        <ArrowRight aria-hidden className="text-teal-700" size={20} />
      </Link>

      {/* 큐레이션된 출처 정의 (정적) */}
      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">출처 정의 및 한계</h3>
            <p className="surface-subtitle">컬럼 정의·활용·한계 큐레이션</p>
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={columns} rowKey={(row) => row.name} rows={dataSources} />
        </div>
      </section>
    </>
  );
}
