import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  Gauge,
  KeyRound,
  Layers,
  LayoutGrid,
  RefreshCw,
  Search,
  ShieldCheck,
  Telescope
} from "lucide-react";
import { dataLineage, type DataLineageSource } from "@/lib/data/generated/dataLineage";
import { realDataQualityWarnings, realDataSummary } from "@/lib/data/generated/realData";
import { dataVintages, type Cadence } from "@/lib/data/dataVintage";
import { SURFACED } from "@/lib/data/sourceMeta";
import { candidateSources, dataAxisMapping, type ResearchPriority } from "@/lib/data/researchNotes";
import { dataSources, type DataSourceItem } from "@/lib/data/dataSources";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import { DataFreshnessPanel } from "@/components/ui/DataFreshness";
import { SourceApprovalQueue } from "@/components/admin/SourceApprovalQueue";

// 공표 주기별 배지 색상.
const CADENCE_TONE: Record<Cadence, string> = {
  실시간: "bg-teal-100 text-teal-800",
  월별: "bg-blue-100 text-blue-800",
  연간: "bg-amber-100 text-amber-800",
  부정기: "bg-slate-200 text-slate-600"
};

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
    header: "대시보드 반영",
    accessor: (row) =>
      SURFACED[row.id] ? (
        <span className="font-medium text-emerald-700">✓ {SURFACED[row.id]}</span>
      ) : (
        <span className="text-slate-400">미연동</span>
      )
  },
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

// 출처 정의·한계 테이블 컬럼 (구 /data-sources 흡수) — 데이터명/제공기관/갱신주기/주요 컬럼/한계
const sourceColumns: DataTableColumn<DataSourceItem>[] = [
  { header: "데이터명", accessor: (row) => <span className="font-semibold text-ink">{row.name}</span> },
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
  { header: "한계", accessor: (row) => <span className="text-muted">{row.limitation}</span> }
];

export default function DataPipelinePage() {
  const { totals, keysPresent, generatedAt, sources, discovery } = dataLineage;

  // ── 데이터 건강 종합 진단 ────────────────────────────────────────────────────────
  const verifiedCount = sources.filter((s) => s.verified).length;
  const secured = totals.downloaded + totals.cached;
  const securedRate = totals.sources ? (secured / totals.sources) * 100 : 0;
  const freshRate = totals.sources ? (totals.downloaded / totals.sources) * 100 : 0;
  const verifiedRate = totals.sources ? (verifiedCount / totals.sources) * 100 : 0;
  const warningCount = realDataQualityWarnings.length;
  const retainedCount = realDataSummary.retainedExportCount;
  const retainedExports = realDataSummary.retainedExports as readonly unknown[];
  const qualityScore = warningCount === 0 ? 100 : Math.max(0, 100 - warningCount * 25);
  const retainScore = retainedCount === 0 ? 100 : Math.max(0, 100 - retainedCount * 15);
  const healthScore = Math.round(
    securedRate * 0.45 + freshRate * 0.2 + verifiedRate * 0.2 + qualityScore * 0.1 + retainScore * 0.05
  );
  const health =
    healthScore >= 85
      ? { label: "양호", tone: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" }
      : healthScore >= 70
        ? { label: "주의", tone: "#b45309", bg: "#fffbeb", border: "#fde68a" }
        : { label: "경고", tone: "#be123c", bg: "#fef2f2", border: "#fecaca" };
  const healthDims = [
    { label: "수집 확보율", value: securedRate, note: `${secured}/${totals.sources}개 (수집+캐시)`, color: "#0f766e" },
    { label: "신규 수집률", value: freshRate, note: `${totals.downloaded}/${totals.sources}개 최신 수집`, color: "#3157a4" },
    { label: "검증 확정률", value: verifiedRate, note: `${verifiedCount}/${totals.sources}개 확정`, color: "#b45309" }
  ];

  // ── 수집 데이터 커버리지 (구 /data-sources 흡수) ────────────────────────────────
  const statusRank = (s: string) => (s === "downloaded" ? 0 : s === "skipped_no_key" ? 2 : 1);
  const allSources = [...sources].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status) || (b.rowCount ?? 0) - (a.rowCount ?? 0)
  );
  const surfacedCount = sources.filter((s) => SURFACED[s.id]).length;
  const statusSegments = [
    { label: "수집 성공", value: totals.downloaded, color: "#0f766e" },
    { label: "수집 실패", value: totals.failed, color: "#be123c" },
    { label: "키 없음 스킵", value: totals.skippedNoKey, color: "#b45309" },
    { label: "캐시 재사용", value: totals.cached, color: "#64748b" }
  ];
  const stackTotal = statusSegments.reduce((sum, x) => sum + x.value, 0) || 1;
  const successRate = Math.round((totals.downloaded / stackTotal) * 100);

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">수집 파이프라인</p>
        <h2 className="page-title">메타데이터 관리</h2>
        <p className="page-description">
          공공데이터 자동 수집 배치(매일 01:00 KST / 16:00 UTC, GitHub Actions)의 실행 상태를 관리합니다.
          데이터 건강 점수, 각 출처의 수집 성공·실패, 요청 URL, 출처 정의·활용 한계, 대시보드 반영 커버리지,
          신규 데이터셋 발굴 결과, 인증키 상태를 한 화면에서 점검할 수 있습니다.
        </p>
      </section>

      {/* 배치 실행 상태 바 */}
      <section className="surface flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw aria-hidden className="text-teal-700" size={16} />
          <span className="font-semibold text-ink">최근 배치</span>
          <span className="text-muted">{new Date(generatedAt).toLocaleString("ko-KR")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <KeyRound aria-hidden className="text-slate-500" size={16} />
          <span className="text-muted">인증키</span>
          {[
            { key: "DATA_GO_KR_SERVICE_KEY", label: "data.go.kr" },
            { key: "KOSIS_API_KEY", label: "KOSIS" },
            { key: "ECOS_API_KEY", label: "ECOS" },
            { key: "SEOUL_OPENAPI_KEY", label: "서울" }
          ].map((k, i) => (
            <span key={k.key} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-300">|</span>}
              <span className={keysPresent[k.key] ? "text-teal-700" : "text-red-700"}>
                {k.label} {keysPresent[k.key] ? "있음" : "없음"}
              </span>
            </span>
          ))}
        </div>
        <span className="ml-auto rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
          스케줄: 매일 01:00 KST (16:00 UTC) · GitHub Actions
        </span>
      </section>

      {/* 데이터 갱신 상태 (뷰 시점 실시간 판정 — 실제 갱신 여부) */}
      <DataFreshnessPanel generatedAt={generatedAt} />

      {/* 데이터 기준시점·공표 주기 — '수집일 ≠ 기준연월' 오해 방지 */}
      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">데이터 기준시점 · 공표 주기</h3>
            <p className="surface-subtitle">
              수집은 매일 돌지만, 화면의 기준연월은 원 통계의 공표 시점을 따릅니다. 연간 통계는 보통 기준연도 1~1.5년 뒤
              공표되며, 새 시점이 공표되면 다음 배치에서 자동 반영됩니다.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-2.5 text-left text-xs font-bold">데이터 · 출처</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">기준시점</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">공표 주기</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">최신성 설명</th>
              </tr>
            </thead>
            <tbody>
              {dataVintages.map((v) => (
                <tr key={v.label} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="px-4 py-2.5 font-medium text-ink">{v.label}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono font-semibold text-slate-700">{v.asOf}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${CADENCE_TONE[v.cadence]}`}>
                      {v.cadence}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs leading-5 text-muted">{v.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* 데이터 건강 대시보드 */}
      <section className="surface mt-4 p-5">
        <div className="flex items-center gap-2">
          <Activity aria-hidden className="text-teal-700" size={18} />
          <div>
            <h3 className="surface-title">데이터 건강 대시보드</h3>
            <p className="surface-subtitle">수집 확보·신선도·검증·품질·폴백 보존 상태 종합 진단</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* 종합 건강 점수 */}
          <div
            className="flex flex-col items-center justify-center rounded-xl px-5 py-6 text-center"
            style={{ background: health.bg, border: `1px solid ${health.border}` }}
          >
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: health.tone }}>
              <Gauge size={14} aria-hidden /> 종합 건강 점수
            </span>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-5xl font-black leading-none" style={{ color: health.tone }}>{healthScore}</span>
              <span className="mb-1 text-lg font-bold text-muted">/100</span>
            </div>
            <span
              className="mt-3 rounded-full px-3 py-1 text-sm font-bold text-white"
              style={{ background: health.tone }}
            >
              {health.label}
            </span>
            <p className="mt-3 text-[11px] leading-4 text-muted">
              확보율·검증·품질·폴백 가중 합산 · 매 배치 자동 산출
            </p>
          </div>

          {/* 진단 지표 바 */}
          <div className="flex flex-col justify-center gap-4">
            {healthDims.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{d.label}</span>
                  <span className="font-mono font-bold" style={{ color: d.color }}>{d.value.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#f1f5f9" }}>
                  <div className="h-2.5 rounded-full" style={{ width: `${Math.max(2, Math.min(100, d.value))}%`, background: d.color }} />
                </div>
                <p className="mt-1 text-[11px] text-muted">{d.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 품질 경보 + 폴백 보존 */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* 품질 경보 */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              {warningCount === 0 ? (
                <ShieldCheck aria-hidden className="text-teal-700" size={16} />
              ) : (
                <AlertTriangle aria-hidden className="text-rose-600" size={16} />
              )}
              <h4 className="text-sm font-bold text-ink">시계열 품질 경보</h4>
              <span
                className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${warningCount === 0 ? "bg-teal-100 text-teal-800" : "bg-rose-100 text-rose-800"}`}
              >
                {warningCount === 0 ? "정상" : `${warningCount}건`}
              </span>
            </div>
            {warningCount === 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <CheckCircle2 size={13} className="text-teal-600" aria-hidden />
                주요 시계열에서 비정상 급락·집계기준 변동이 감지되지 않았습니다.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {realDataQualityWarnings.map((w, i) => (
                  <li key={i} className="rounded-md bg-rose-50 p-2 text-xs leading-5 text-rose-800">
                    <span className="font-semibold">{w.series}</span> · {w.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 폴백(last-good) 보존 */}
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Archive aria-hidden className={retainedCount === 0 ? "text-teal-700" : "text-amber-600"} size={16} />
              <h4 className="text-sm font-bold text-ink">폴백 보존 (last-good)</h4>
              <span
                className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${retainedCount === 0 ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"}`}
              >
                {retainedCount === 0 ? "전량 최신" : `${retainedCount}개 보존`}
              </span>
            </div>
            {retainedCount === 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <CheckCircle2 size={13} className="text-teal-600" aria-hidden />
                모든 지표가 이번 배치의 신규 수집분을 사용 중입니다(직전 커밋 폴백 없음).
              </p>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted">
                  수집 실패로 직전 커밋 데이터를 유지한 지표입니다(회귀 방지).
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {retainedExports.map((e, i) => (
                    <span key={i} className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-mono text-amber-800">
                      {typeof e === "string" ? e : JSON.stringify(e)}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 수집 이력 · 커버리지 (lineage + 대시보드 반영 통합) */}
      <section className="surface mt-4 p-4">
        <div className="surface-header pb-2">
          <div className="flex items-center gap-2">
            <Layers aria-hidden className="text-teal-700" size={18} />
            <div>
              <h3 className="surface-title">수집 이력 · 커버리지</h3>
              <p className="surface-subtitle">
                매 배치 자동 기록(git 일자별 보존) · 수집된 {totals.sources}개 출처와 대시보드 반영 {surfacedCount}종을 한 표에서 확인
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">성공률 {successRate}%</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{allSources.length} sources</span>
          </div>
        </div>

        {/* 상태 분포 스택 바 */}
        <div className="px-1 pb-3">
          <div className="flex h-4 w-full overflow-hidden rounded-lg bg-slate-100">
            {statusSegments.map((seg) =>
              seg.value > 0 ? (
                <div
                  key={seg.label}
                  className="h-full"
                  style={{ width: `${(seg.value / stackTotal) * 100}%`, background: seg.color }}
                  title={`${seg.label} ${seg.value}`}
                />
              ) : null
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
            {statusSegments.map((seg) => (
              <span key={seg.label} className="flex items-center gap-1.5 text-xs">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
                <span className="text-muted">{seg.label}</span>
                <span className="font-mono font-semibold text-ink">{seg.value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* 통합 소스 테이블 — lineage + 대시보드 반영(커버리지) */}
        <div className="p-1">
          <DataTable columns={lineageColumns} rowKey={(row) => row.id} rows={allSources} />
        </div>
        <p className="px-3 pt-1 text-xs leading-6 text-muted">
          ※ &lsquo;대시보드 반영&rsquo; 열은 빌드 시 페이지 소스코드를 스캔해 <strong>자동 계산</strong>됩니다
          (build_real_data.mjs). 각 출처가 어느 페이지에 실제 표시되는지 코드 기준으로 판정하므로 수동 관리가 불필요합니다.
          &lsquo;미연동&rsquo;은 자동 수집은 되지만 아직 화면에서 참조하지 않는 출처입니다.
        </p>
      </section>

      {/* 출처별 수집 상세 (요청 URL·오류 드릴다운) */}
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

      {/* 데이터 에이전트 + 승인 큐(인라인) */}
      <section className="mt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Search aria-hidden className="text-teal-700" size={16} />
            <h3 className="surface-title">데이터 에이전트</h3>
          </div>
          <Link href="/admin" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
            전체 승인 화면 <ArrowRight aria-hidden size={13} />
          </Link>
        </div>
        <p className="mb-1 px-1 text-sm text-muted">
          키워드를 자동 탐색해 신규 데이터셋 후보를 발굴 · 아래에서 바로 승인/거부하세요
        </p>
        <p className="mb-1 flex flex-wrap items-center gap-x-2 px-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5">
            <Activity aria-hidden size={11} className="text-teal-700" />
            마지막 발굴 실행: <strong className="text-slate-700">{new Date(generatedAt).toLocaleString("ko-KR")}</strong>
          </span>
          <span>키워드 {discovery.length}개 스캔 · 매일 01:00 KST 배치 시 자동 발굴</span>
        </p>

        {/* 라이브 승인 큐 (버튼 인라인) */}
        <SourceApprovalQueue compact />

        {/* 최근 키워드 탐색 결과(원본 링크) */}
        {discovery.length > 0 && (
          <details className="surface mt-4 p-4">
            <summary className="cursor-pointer text-sm font-bold text-ink">
              최근 키워드 탐색 결과 · 원본 ({discovery.length})
            </summary>
            <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {discovery.map((d) => (
                <li className="rounded-md border border-slate-200 p-3" key={d.id}>
                  <p className="font-semibold text-ink">
                    {d.provider} · {d.keyword}
                  </p>
                  <p className="text-muted">{d.purpose}</p>
                  <p className="mt-1 text-xs">
                    상태: {d.status === "ok" ? "정상 탐색" : d.status} ·{" "}
                    {d.foundCount > 0 ? `후보 ${d.foundCount}건` : "신규 후보 없음"}
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
          </details>
        )}
      </section>

      {/* 출처 정의 및 한계 (큐레이션 — 구 출처 정의 페이지 흡수) */}
      <section className="surface mt-4">
        <div className="surface-header">
          <div className="flex items-center gap-2">
            <Database aria-hidden className="text-teal-700" size={18} />
            <div>
              <h3 className="surface-title">출처 정의 및 한계</h3>
              <p className="surface-subtitle">주요 출처의 컬럼 정의 · 활용 · 한계 큐레이션 (전체 수집 목록은 위 &lsquo;수집 이력 · 커버리지&rsquo; 참조)</p>
            </div>
          </div>
        </div>
        <div className="p-2">
          <DataTable columns={sourceColumns} rowKey={(row) => row.name} rows={dataSources} />
        </div>
      </section>

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
          <table className="w-full min-w-[820px] text-sm">
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

      {/* 분석 화면으로 (소비자 카탈로그) 왕복 링크 */}
      <Link
        href="/catalog"
        className="surface surface-hover mt-4 flex items-center justify-between gap-4 px-5 py-4 no-underline"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#0f766e" }}>
            <LayoutGrid aria-hidden size={20} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-ink">분석 화면에서 보기 <ArrowRight aria-hidden size={15} /></p>
            <p className="mt-0.5 text-xs text-muted">수집한 데이터를 카테고리별로 탐색하고 분석 차트로 이동 — 데이터 카탈로그(축 2)</p>
          </div>
        </div>
        <ArrowRight aria-hidden className="shrink-0 text-teal-700" size={22} />
      </Link>
    </>
  );
}
