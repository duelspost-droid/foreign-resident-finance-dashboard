"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { dataLineage, type DataLineageSource } from "@/lib/data/generated/dataLineage";
import { SURFACED, TARGET_TABLES, suggestTarget, targetLabel } from "@/lib/data/sourceMeta";
import {
  fetchSurfaceDispositions,
  setSourceDisposition,
  type SourceDisposition
} from "@/lib/data/supabaseClient";

type StatusKey = "surfaced" | "planned" | "archived" | "excluded" | "none";
const REFLECT_TONE: Record<StatusKey, string> = {
  surfaced: "bg-teal-100 text-teal-800",
  planned: "bg-blue-100 text-blue-800",
  archived: "bg-slate-200 text-slate-600",
  excluded: "bg-slate-200 text-slate-500",
  none: "bg-amber-100 text-amber-800"
};
const STATUS_RANK: Record<StatusKey, number> = { none: 0, planned: 1, surfaced: 2, archived: 3, excluded: 4 };

// 메타데이터 관리 '수집 이력·커버리지' + 미연동 1클릭 트리아지(surface_config.disposition).
// 연동됨(SURFACED) = 코드로 차트 연결된 출처. 미연동은 관리자가 연동예정/보관/제외로 분류 → 개발 백로그.
export function CoverageSection() {
  const sources = useMemo(() => [...dataLineage.sources], []);
  const { totals } = dataLineage;
  const [disp, setDisp] = useState<Record<string, SourceDisposition>>({});
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const m = await fetchSurfaceDispositions();
    setConnected(m !== null);
    setDisp(m ?? {});
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const statusOf = useCallback(
    (s: DataLineageSource): StatusKey => {
      if (SURFACED[s.id]) return "surfaced";
      const d = disp[s.id]?.disposition;
      if (d === "planned" || d === "archived" || d === "excluded") return d;
      return "none";
    },
    [disp]
  );

  async function decide(s: DataLineageSource, value: string) {
    setBusyId(s.id);
    const d = value === "" ? null : (value as "planned" | "archived" | "excluded");
    const target = d === "planned" ? disp[s.id]?.targetTable ?? suggestTarget(s).table : undefined;
    const ok = await setSourceDisposition(s.id, d, target);
    if (ok) {
      setDisp((m) => ({ ...m, [s.id]: { disposition: d, targetTable: target ?? m[s.id]?.targetTable ?? null } }));
    }
    setBusyId(null);
  }

  async function retarget(s: DataLineageSource, target: string) {
    setBusyId(s.id);
    const ok = await setSourceDisposition(s.id, "planned", target);
    if (ok) setDisp((m) => ({ ...m, [s.id]: { disposition: "planned", targetTable: target } }));
    setBusyId(null);
  }

  const ordered = useMemo(
    () =>
      [...sources].sort(
        (a, b) => STATUS_RANK[statusOf(a)] - STATUS_RANK[statusOf(b)] || (b.rowCount ?? 0) - (a.rowCount ?? 0)
      ),
    [sources, statusOf]
  );

  const counts = useMemo(() => {
    const c: Record<StatusKey, number> = { surfaced: 0, planned: 0, archived: 0, excluded: 0, none: 0 };
    for (const s of sources) c[statusOf(s)]++;
    return c;
  }, [sources, statusOf]);

  // 수집 상태 분포(collection) 스택바
  const segs = [
    { label: "수집 성공", value: totals.downloaded, color: "#0f766e" },
    { label: "수집 실패", value: totals.failed, color: "#be123c" },
    { label: "키 없음", value: totals.skippedNoKey, color: "#b45309" },
    { label: "캐시", value: totals.cached, color: "#64748b" }
  ];
  const segTotal = segs.reduce((s, x) => s + x.value, 0) || 1;
  const successRate = Math.round((totals.downloaded / segTotal) * 100);

  return (
    <section className="surface mt-4 p-4">
      <div className="surface-header pb-2">
        <div className="flex items-center gap-2">
          <Layers aria-hidden className="text-teal-700" size={18} />
          <div>
            <h3 className="surface-title">수집 이력 · 커버리지</h3>
            <p className="surface-subtitle">출처 {totals.sources}개 · 연동됨 {counts.surfaced}종 · 미연동 1클릭 처리</p>
          </div>
        </div>
        <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">수집 성공률 {successRate}%</span>
      </div>

      {/* 수집 상태 분포 */}
      <div className="px-1 pb-3">
        <div className="flex h-3.5 w-full overflow-hidden rounded-lg bg-slate-100">
          {segs.map((seg) =>
            seg.value > 0 ? (
              <div key={seg.label} className="h-full" style={{ width: `${(seg.value / segTotal) * 100}%`, background: seg.color }} title={`${seg.label} ${seg.value}`} />
            ) : null
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {segs.map((seg) => (
            <span key={seg.label} className="flex items-center gap-1.5 text-xs">
              <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
              <span className="text-muted">{seg.label}</span>
              <span className="font-mono font-semibold text-ink">{seg.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 반영 요약 + 연결 상태 */}
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1 text-xs">
        <span className="text-muted">대시보드 반영</span>
        <span className={`rounded px-1.5 py-0.5 font-semibold ${REFLECT_TONE.surfaced}`}>연동됨 {counts.surfaced}</span>
        <span className={`rounded px-1.5 py-0.5 font-semibold ${REFLECT_TONE.planned}`}>연동 예정 {counts.planned}</span>
        <span className={`rounded px-1.5 py-0.5 font-semibold ${REFLECT_TONE.none}`}>미연동 {counts.none}</span>
        <span className={`rounded px-1.5 py-0.5 font-semibold ${REFLECT_TONE.archived}`}>보관·제외 {counts.archived + counts.excluded}</span>
        <span className="ml-auto text-[11px]">
          {connected === null ? (
            <span className="text-muted">확인 중…</span>
          ) : connected ? (
            <span className="text-teal-700">Supabase 연결됨 · 즉시 저장</span>
          ) : (
            <span className="text-amber-700">Supabase 미연결 — 처리하려면 연결 필요</span>
          )}
        </span>
      </div>

      <div className="table-scroll p-1">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-3 py-2.5 text-left text-xs font-bold">출처</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-bold">행수</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-bold">검증</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold">대시보드 반영</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((s) => {
              const key = statusOf(s);
              const busy = busyId === s.id;
              return (
                <tr key={s.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-[11px] text-muted">{s.provider}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-slate-700">
                    {s.rowCount != null ? s.rowCount.toLocaleString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {s.verified ? <span className="text-teal-700">확정</span> : <span className="text-amber-700">미확정</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {key === "surfaced" ? (
                      <span className="inline-flex items-center gap-1">
                        <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold ${REFLECT_TONE.surfaced}`}>✓ 연동됨</span>
                        <span className="text-[11px] text-muted">{SURFACED[s.id]}</span>
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <select
                          value={disp[s.id]?.disposition ?? ""}
                          disabled={busy || connected === false}
                          onChange={(e) => decide(s, e.target.value)}
                          className={`rounded-md border px-2 py-1 text-xs ${key === "none" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 text-slate-700"} disabled:opacity-50`}
                          aria-label="반영 처리"
                        >
                          <option value="">미연동(미정)</option>
                          <option value="planned">연동 예정</option>
                          <option value="archived">보관(raw)</option>
                          <option value="excluded">제외</option>
                        </select>
                        {key === "planned" && (
                          <select
                            value={disp[s.id]?.targetTable ?? suggestTarget(s).table}
                            disabled={busy || connected === false}
                            onChange={(e) => retarget(s, e.target.value)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 disabled:opacity-50"
                            aria-label="대상 도메인"
                            title="연동 대상 도메인(개발 참고)"
                          >
                            {TARGET_TABLES.map((t) => (
                              <option key={t} value={t}>{targetLabel(t)}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-3 pt-1.5 text-xs leading-6 text-muted">
        ※ ‘연동됨’은 화면에 실제 차트로 연결된 출처입니다. ‘미연동’은 <strong className="text-slate-600">연동 예정 / 보관 / 제외</strong>로 1클릭
        분류하세요 — ‘연동 예정’은 개발 백로그로 잡혀 차트 연결 후 ‘연동됨’이 됩니다.
      </p>
    </section>
  );
}
