import { ExternalLink } from "lucide-react";
import { dataSources } from "@/lib/data/dataSources";
import { dataLineage, type DataLineageSource } from "@/lib/data/generated/dataLineage";
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

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  downloaded: { text: "수집 성공", tone: "bg-teal-100 text-teal-800" },
  metadata_failed_using_cached_raw: { text: "캐시 사용", tone: "bg-amber-100 text-amber-800" },
  metadata_without_file_using_cached_raw: { text: "캐시 사용", tone: "bg-amber-100 text-amber-800" },
  skipped_no_key: { text: "키 없음(대기)", tone: "bg-slate-200 text-slate-700" },
  no_data: { text: "응답 0건", tone: "bg-red-100 text-red-800" },
  api_error: { text: "API 오류", tone: "bg-red-100 text-red-800" },
  request_failed: { text: "요청 실패", tone: "bg-red-100 text-red-800" }
};

function statusBadge(status: string) {
  const info = STATUS_LABEL[status] ?? { text: status, tone: "bg-slate-200 text-slate-700" };
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${info.tone}`}>{info.text}</span>;
}

const lineageColumns: DataTableColumn<DataLineageSource>[] = [
  { header: "출처", accessor: (row) => `${row.provider} · ${row.title}` },
  { header: "방식", accessor: (row) => row.type },
  { header: "상태", accessor: (row) => statusBadge(row.status) },
  { header: "행수", accessor: (row) => (row.rowCount != null ? row.rowCount.toLocaleString() : "—") },
  {
    header: "최근 수집",
    accessor: (row) => (row.fetchedAt ? new Date(row.fetchedAt).toLocaleString("ko-KR") : "—")
  },
  {
    header: "검증",
    accessor: (row) =>
      row.verified ? (
        <span className="text-teal-700">확정</span>
      ) : (
        <span className="text-amber-700">미확정</span>
      )
  }
];

export default function DataSourcesPage() {
  const { totals, keysPresent, generatedAt, sources, discovery } = dataLineage;

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">데이터 소스</p>
        <h2 className="page-title">출처와 수집 이력 관리</h2>
        <p className="page-description">
          대시보드의 모든 분석은 공개 통계 또는 집계 데이터 기준입니다. 각 출처의 기준, 갱신주기,
          한계와 함께 실제 수집 이력(성공·실패·요청 URL)을 기록합니다.
        </p>
      </section>

      {/* 수집 요약 */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "등록 출처", value: totals.sources, tone: "text-ink" },
          { label: "수집 성공", value: totals.downloaded, tone: "text-teal-700" },
          { label: "캐시 사용", value: totals.cached, tone: "text-amber-700" },
          { label: "키 대기", value: totals.skippedNoKey, tone: "text-slate-600" },
          { label: "실패", value: totals.failed, tone: "text-red-700" }
        ].map((card) => (
          <div className="surface p-4" key={card.label}>
            <p className="text-sm text-muted">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </section>

      <p className="mt-2 text-xs text-muted">
        최근 배치 실행: {new Date(generatedAt).toLocaleString("ko-KR")} · 인증키 상태 —
        data.go.kr: {keysPresent.DATA_GO_KR_SERVICE_KEY ? "있음" : "없음"}, KOSIS:{" "}
        {keysPresent.KOSIS_API_KEY ? "있음" : "없음"}
      </p>

      {/* 수집 이력 테이블 */}
      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">수집 이력 (lineage)</h3>
            <p className="surface-subtitle">
              매 배치 실행 시 자동 기록 · git 이력으로 일자별 보존
            </p>
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={lineageColumns} rowKey={(row) => row.id} rows={[...sources]} />
        </div>
      </section>

      {/* 출처별 상세 카드 (요청 URL 포함) */}
      <section className="grid gap-4 pt-4 md:grid-cols-2">
        {sources.map((source) => (
          <article className="surface p-4" key={source.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink">{source.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {source.provider} · {source.category ?? "기타"}
                </p>
              </div>
              {statusBadge(source.status)}
            </div>
            <dl className="mt-3 space-y-1 text-sm text-slate-700">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">갱신주기</dt>
                <dd>{source.updateCycle ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">라이선스</dt>
                <dd className="text-right">{source.license ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">저장 파일</dt>
                <dd className="truncate text-right">{source.savedFile ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">개인정보 안전</dt>
                <dd>{source.personalDataSafe ? "집계값만" : "확인 필요"}</dd>
              </div>
            </dl>
            {source.notes && (
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {source.notes}
              </p>
            )}
            {source.requestUrls.length > 0 && (
              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer">요청 URL ({source.requestUrls.length})</summary>
                <ul className="mt-1 space-y-1 break-all">
                  {source.requestUrls.map((url, i) => (
                    <li key={i}>{url}</li>
                  ))}
                </ul>
              </details>
            )}
            {source.sourceUrl && (
              <a
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700"
                href={source.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                원본 페이지 <ExternalLink aria-hidden size={14} />
              </a>
            )}
          </article>
        ))}
      </section>

      {/* 신규 데이터셋 발굴 후보 */}
      {discovery.length > 0 && (
        <section className="surface mt-4 p-4">
          <h3 className="surface-title">신규 데이터셋 발굴 후보</h3>
          <p className="surface-subtitle">data.go.kr 키워드 탐색 결과 (배치 자동 기록)</p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            {discovery.map((d) => (
              <li className="rounded-md border border-slate-200 p-3" key={d.id}>
                <p className="font-semibold text-ink">
                  {d.provider} · {d.keyword}
                </p>
                <p className="text-muted">{d.purpose}</p>
                <p className="mt-1 text-xs">
                  상태: {d.status} · 후보 {d.foundCount}건
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

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
