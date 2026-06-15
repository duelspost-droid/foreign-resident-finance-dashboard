import { ExternalLink, KeyRound, RefreshCw, Search, Telescope } from "lucide-react";
import { dataLineage, type DataLineageSource } from "@/lib/data/generated/dataLineage";
import { candidateSources, dataAxisMapping, type ResearchPriority } from "@/lib/data/researchNotes";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";

const PRIORITY_LABEL: Record<ResearchPriority, { text: string; tone: string }> = {
  high: { text: "높음", tone: "bg-teal-100 text-teal-800" },
  mid: { text: "중간", tone: "bg-blue-100 text-blue-800" },
  low: { text: "낮음", tone: "bg-slate-200 text-slate-600" }
};

const STATUS_LABEL: Record<string, { text: string; tone: string }> = {
  downloaded: { text: "수집 성공", tone: "bg-teal-100 text-teal-800" },
  cached: { text: "캐시 사용", tone: "bg-amber-100 text-amber-800" },
  metadata_failed_using_cached_raw: { text: "캐시 사용", tone: "bg-amber-100 text-amber-800" },
  metadata_without_file_using_cached_raw: { text: "캐시 사용", tone: "bg-amber-100 text-amber-800" },
  skipped_no_key: { text: "키 없음(대기)", tone: "bg-slate-200 text-slate-700" },
  no_data: { text: "응답 0건", tone: "bg-red-100 text-red-800" },
  api_error: { text: "API 오류", tone: "bg-red-100 text-red-800" },
  request_failed: { text: "요청 실패", tone: "bg-red-100 text-red-800" },
  metadata_failed: { text: "메타 실패", tone: "bg-red-100 text-red-800" }
};

function statusBadge(status: string) {
  const info = STATUS_LABEL[status] ?? { text: status, tone: "bg-slate-200 text-slate-700" };
  return <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${info.tone}`}>{info.text}</span>;
}

const lineageColumns: DataTableColumn<DataLineageSource>[] = [
  { header: "출처", accessor: (row) => `${row.provider} · ${row.title}` },
  { header: "방식", accessor: (row) => row.type },
  { header: "상태", accessor: (row) => statusBadge(row.status) },
  { header: "행수", accessor: (row) => (row.rowCount != null ? row.rowCount.toLocaleString() : "—"), align: "right" },
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

export default function DataPipelinePage() {
  const { totals, keysPresent, generatedAt, sources, discovery } = dataLineage;

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">수집 파이프라인</p>
        <h2 className="page-title">데이터 수집기 관리</h2>
        <p className="page-description">
          공공데이터 자동 수집 배치(매일 18:30 UTC, GitHub Actions)의 실행 상태를 관리합니다.
          각 출처의 수집 성공·실패, 요청 URL, 신규 데이터셋 발굴 결과, 인증키 상태를 한 화면에서 점검할 수 있습니다.
        </p>
      </section>

      {/* 배치 실행 상태 바 */}
      <section className="surface flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw aria-hidden className="text-teal-700" size={16} />
          <span className="font-semibold text-ink">최근 배치</span>
          <span className="text-muted">{new Date(generatedAt).toLocaleString("ko-KR")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <KeyRound aria-hidden className="text-slate-500" size={16} />
          <span className="text-muted">인증키</span>
          <span className={keysPresent.DATA_GO_KR_SERVICE_KEY ? "text-teal-700" : "text-red-700"}>
            data.go.kr {keysPresent.DATA_GO_KR_SERVICE_KEY ? "있음" : "없음"}
          </span>
          <span className="text-slate-300">|</span>
          <span className={keysPresent.KOSIS_API_KEY ? "text-teal-700" : "text-red-700"}>
            KOSIS {keysPresent.KOSIS_API_KEY ? "있음" : "없음"}
          </span>
        </div>
        <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
          스케줄: 매일 18:30 UTC · GitHub Actions
        </span>
      </section>

      {/* 수집 요약 카드 */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* 수집 이력 테이블 */}
      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">수집 이력 (lineage)</h3>
            <p className="surface-subtitle">매 배치 실행 시 자동 기록 · git 이력으로 일자별 보존</p>
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={lineageColumns} rowKey={(row) => row.id} rows={[...sources]} />
        </div>
      </section>

      {/* 출처별 수집 상세 (요청 URL 포함) */}
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
                <dt className="text-muted">행수</dt>
                <dd>{source.rowCount != null ? source.rowCount.toLocaleString() : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">저장 파일</dt>
                <dd className="truncate text-right">{source.savedFile ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">검증</dt>
                <dd>{source.verified ? "확정" : "미확정"}</dd>
              </div>
            </dl>
            {source.reason && (
              <p className="mt-3 rounded-md bg-red-50 p-2 text-xs leading-5 text-red-800">
                {source.reason}
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

      {/* 신규 데이터셋 발굴 후보 (배치 자동 탐색) */}
      {discovery.length > 0 && (
        <section className="surface mt-4 p-4">
          <div className="flex items-center gap-2">
            <Search aria-hidden className="text-teal-700" size={16} />
            <h3 className="surface-title">신규 데이터셋 발굴 후보</h3>
          </div>
          <p className="surface-subtitle">data.go.kr 키워드 자동 탐색 결과 · 배치마다 갱신</p>
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
                {d.links.length > 0 && (
                  <details className="mt-2 text-xs text-slate-500">
                    <summary className="cursor-pointer">발견된 데이터셋 ({d.links.length})</summary>
                    <ul className="mt-1 space-y-1">
                      {d.links.map((l) => (
                        <li key={l.datasetId + l.kind}>
                          <a
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                            href={l.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            [{l.kind}] {l.datasetId} <ExternalLink aria-hidden size={11} />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 조사 노트 — 후보 출처 (수동 큐레이션) */}
      <section className="surface mt-4">
        <div className="surface-header">
          <div className="flex items-center gap-2">
            <Telescope aria-hidden className="text-teal-700" size={18} />
            <div>
              <h3 className="surface-title">조사 노트 · 후보 출처</h3>
              <p className="surface-subtitle">
                금융 인사이트 관점 출처 조사 결과 · 등록 여부·우선순위·활용 근거
              </p>
            </div>
          </div>
        </div>
        <div className="table-scroll p-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-muted">
                <th className="px-3 py-2">제공기관</th>
                <th className="px-3 py-2">데이터</th>
                <th className="px-3 py-2">식별자</th>
                <th className="px-3 py-2">인증키</th>
                <th className="px-3 py-2">우선순위</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">활용 근거</th>
              </tr>
            </thead>
            <tbody>
              {candidateSources.map((c) => {
                const pr = PRIORITY_LABEL[c.priority];
                return (
                  <tr className="border-b border-slate-50 align-top" key={c.provider + c.ref}>
                    <td className="px-3 py-2 text-slate-600">{c.provider}</td>
                    <td className="px-3 py-2 font-medium text-ink">
                      <a className="hover:text-teal-700" href={c.sourceUrl} rel="noreferrer" target="_blank">
                        {c.title}
                      </a>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{c.ref}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">{c.keyEnv ?? "불필요"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${pr.tone}`}>{pr.text}</span>
                    </td>
                    <td className="px-3 py-2">
                      {c.registered ? (
                        <span className="text-xs font-semibold text-teal-700">등록됨</span>
                      ) : (
                        <span className="text-xs text-amber-700">후속 검토</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">{c.rationale}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 데이터 축 × 금융 인사이트 매핑 */}
      <section className="surface mt-4 p-4">
        <h3 className="surface-title">데이터 축 × 금융 인사이트</h3>
        <p className="surface-subtitle">수집 데이터를 분석가 관점에서 어떻게 활용하는지 요약</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {dataAxisMapping.map((m) => (
            <div className="rounded-md border border-slate-200 p-3" key={m.axis}>
              <p className="text-sm font-bold text-ink">{m.axis}</p>
              <p className="mt-1 text-xs text-muted">{m.sources}</p>
              <p className="mt-1 text-xs text-teal-700">→ {m.insight}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
