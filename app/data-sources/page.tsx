import Link from "next/link";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ArrowRight,
  Layers,
  ShieldCheck
} from "lucide-react";
import { dataSources, type DataSourceItem } from "@/lib/data/dataSources";
import { dataLineage } from "@/lib/data/generated/dataLineage";
import { PageHero } from "@/components/ui/PageHero";
import { StatTile } from "@/components/ui/StatTile";
import { Panel } from "@/components/ui/Panel";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";

const TEAL = "#0f766e";
const COBALT = "#3157a4";
const AMBER = "#b45309";
const BERRY = "#be123c";
const SLATE = "#64748b";

// 수집 소스가 현재 어느 대시보드 화면에 반영되는지 매핑(투명한 커버리지 표시용).
// 매핑이 없으면 "수집만 / 미연동"으로 표시한다.
const SURFACED: Record<string, string> = {
  moj_foreign_resident_status_2024: "국적·체류자격·기회점수",
  moj_foreign_stay_data_2024: "지역 분석",
  moj_foreign_student_stay_2024: "대학/유학생",
  academyinfo_foreign_student_count: "대학별 랭킹",
  mois_foreign_resident_region_file: "시군구 외국인주민",
  kosis_foreigner_economic_activity: "체류자격(보조)"
};

// 출처 정의 테이블 컬럼 — 데이터명/제공기관/갱신주기/주요 컬럼(태그)/한계
const columns: DataTableColumn<DataSourceItem>[] = [
  {
    header: "데이터명",
    accessor: (row) => <span className="font-semibold text-ink">{row.name}</span>
  },
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

// 실시간 수집 상태 배지 — downloaded=teal, skipped_no_key=amber, 그 외=berry
function statusStyle(status: string): { label: string; color: string } {
  if (status === "downloaded") return { label: "수집 성공", color: TEAL };
  if (status === "skipped_no_key") return { label: "키 없음 스킵", color: AMBER };
  return { label: status, color: BERRY };
}

export default function DataSourcesPage() {
  const { totals } = dataLineage;
  const verifiedCount = dataLineage.sources.filter((s) => s.verified).length;

  // 수집 현황 스택 바 — 실제 totals 값만 사용
  const segments = [
    { label: "수집 성공", value: totals.downloaded, color: TEAL },
    { label: "수집 실패", value: totals.failed, color: BERRY },
    { label: "키 없음 스킵", value: totals.skippedNoKey, color: AMBER },
    { label: "캐시 재사용", value: totals.cached, color: SLATE }
  ];
  const stackTotal = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const successRate = Math.round((totals.downloaded / stackTotal) * 100);

  // 커버리지: 수집된 모든 소스를 상태순으로 정렬하고, 대시보드 반영 여부를 표시.
  const statusRank = (s: string) =>
    s === "downloaded" ? 0 : s === "skipped_no_key" ? 2 : 1;
  const allSources = [...dataLineage.sources].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status) || (b.rowCount ?? 0) - (a.rowCount ?? 0)
  );
  const surfacedCount = dataLineage.sources.filter((s) => SURFACED[s.id]).length;

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="데이터 소스"
        title="출처 정의와 활용 한계"
        description="대시보드의 모든 분석은 공개 통계 또는 집계 데이터 기준입니다. 각 출처의 기준·갱신주기·주요 컬럼과 활용 한계를 큐레이션해 기록하고, 자동 수집 파이프라인의 실시간 상태를 함께 추적합니다."
        right={
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white">
            <ShieldCheck aria-hidden size={20} />
            <div className="leading-tight">
              <p className="text-lg font-bold">{verifiedCount}</p>
              <p className="text-[11px] text-white/75">검증 완료 출처</p>
            </div>
          </div>
        }
      />

      <div className="stat-grid">
        <StatTile
          label="등록 출처"
          value={totals.sources}
          unit="개"
          icon={<Database aria-hidden size={18} />}
          accent={TEAL}
          sub="공개 통계 · API · 내부 집계"
        />
        <StatTile
          label="수집 성공"
          value={totals.downloaded}
          unit="건"
          icon={<CheckCircle2 aria-hidden size={18} />}
          accent={TEAL}
          trend={{ label: `성공률 ${successRate}%`, dir: "up" }}
        />
        <StatTile
          label="수집 실패"
          value={totals.failed}
          unit="건"
          icon={<AlertTriangle aria-hidden size={18} />}
          accent={BERRY}
          trend={{ label: "재시도 필요", dir: "down" }}
        />
        <StatTile
          label="키 없음 스킵"
          value={totals.skippedNoKey}
          unit="건"
          icon={<KeyRound aria-hidden size={18} />}
          accent={AMBER}
          sub="API 키 등록 시 활성화"
        />
      </div>

      <Panel
        title="수집 현황"
        subtitle={`최근 배치 기준 출처 ${totals.sources}개의 처리 결과 분포`}
        right={<span className="eyebrow">{dataLineage.generatedAt.slice(0, 10)} 기준</span>}
      >
        <div className="space-y-4">
          <div className="flex h-5 w-full overflow-hidden rounded-lg bg-slate-100">
            {segments.map((seg) =>
              seg.value > 0 ? (
                <div
                  key={seg.label}
                  className="h-full"
                  style={{
                    width: `${(seg.value / stackTotal) * 100}%`,
                    background: seg.color
                  }}
                  title={`${seg.label} ${seg.value}`}
                />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {segments.map((seg) => (
              <div className="flex items-center gap-2 text-sm" key={seg.label}>
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: seg.color }}
                />
                <span className="text-muted">{seg.label}</span>
                <span className="font-mono font-semibold text-ink">{seg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Link
        href="/data-pipeline"
        className="surface surface-hover flex items-center justify-between gap-4 px-5 py-4 no-underline"
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: COBALT }}
          >
            <Layers aria-hidden size={20} />
          </span>
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-ink">
              수집 파이프라인 관리 <ArrowRight aria-hidden size={15} />
            </p>
            <p className="mt-0.5 text-xs text-muted">
              등록 출처 {totals.sources}개 · 수집 성공 {totals.downloaded} · 실패 {totals.failed} ·
              키 없음 스킵 {totals.skippedNoKey} · 요청 URL과 발굴 후보 확인
            </p>
          </div>
        </div>
        <ArrowRight aria-hidden className="shrink-0 text-teal-700" size={22} />
      </Link>

      <Panel title="출처 정의 및 한계" subtitle="컬럼 정의 · 활용 · 한계 큐레이션" bodyClassName="p-2">
        <DataTable columns={columns} rowKey={(row) => row.name} rows={dataSources} />
      </Panel>

      <Panel
        title="수집 데이터 커버리지"
        subtitle={`수집된 ${totals.sources}개 출처 전체 · 현재 대시보드 반영 ${surfacedCount}종 · 나머지는 수집·검증 단계`}
        right={<span className="eyebrow">{allSources.length} sources</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted">상태</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted">데이터 / 제공기관</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold text-muted">행수</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold text-muted">대시보드 반영</th>
              </tr>
            </thead>
            <tbody>
              {allSources.map((source) => {
                const badge = statusStyle(source.status);
                const surfaced = SURFACED[source.id];
                return (
                  <tr key={source.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                        style={{ background: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-ink">{source.title}</p>
                      <p className="text-xs text-muted">{source.provider}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-700">
                      {source.rowCount != null ? source.rowCount.toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {surfaced ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: "#ecfdf5", color: "#059669" }}
                        >
                          ✓ {surfaced}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                          style={{ background: "#f1f5f9", color: SLATE }}
                        >
                          수집만 (미연동)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="px-1 pt-4 text-xs leading-6 text-muted">
          ※ &lsquo;수집만(미연동)&rsquo;은 자동 수집은 되지만 아직 화면에 반영되지 않은 출처입니다.
          대학알리미(대학별 유학생)·시군구 외국인주민 등 대용량 파일은 컬럼 구조 검증 후 단계적으로 연동됩니다.
        </p>
      </Panel>
    </div>
  );
}
