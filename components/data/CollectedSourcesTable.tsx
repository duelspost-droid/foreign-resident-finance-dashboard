"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { DataLineageSource } from "@/lib/data/generated/dataLineage";
import { SURFACED, targetLabel } from "@/lib/data/sourceMeta";
import { fetchSurfaceConfig, type SurfaceConfigRow } from "@/lib/data/supabaseClient";

const STATUS_BADGE: Record<string, { text: string; cls: string }> = {
  downloaded: { text: "수집 성공", cls: "bg-teal-100 text-teal-800" },
  cached: { text: "캐시 유지", cls: "bg-amber-100 text-amber-800" },
  skipped_no_key: { text: "키 대기", cls: "bg-slate-100 text-slate-600" }
};

function statusBadge(status: string) {
  return STATUS_BADGE[status] ?? { text: status === "no_data" ? "데이터 없음" : "수집 실패", cls: "bg-rose-100 text-rose-700" };
}

type StatusFilter = "all" | "ok" | "issue";
type LinkFilter = "all" | "surfaced" | "unsurfaced";

// 모든 수집 데이터셋(승인·미분류 포함)을 검색·필터로 보여주는 뷰어.
export function CollectedSourcesTable({
  sources,
  categorizedIds
}: {
  sources: DataLineageSource[];
  categorizedIds: string[];
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [link, setLink] = useState<LinkFilter>("all");
  const [approvedOnly, setApprovedOnly] = useState(false);

  const catSet = useMemo(() => new Set(categorizedIds), [categorizedIds]);

  // surface_config(관리자 반영 설정)를 런타임에 읽어 하드코딩 SURFACED 위에 덮어쓴다.
  const [cfg, setCfg] = useState<Record<string, SurfaceConfigRow>>({});
  useEffect(() => {
    let alive = true;
    fetchSurfaceConfig().then((rows) => {
      if (!alive || !rows) return;
      const m: Record<string, SurfaceConfigRow> = {};
      for (const r of rows) m[r.sourceId] = r;
      setCfg(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  const screenFor = (id: string) => cfg[id]?.screen ?? SURFACED[id] ?? "";
  const enabledFor = (id: string) => cfg[id]?.enabled ?? true;
  const labelFor = (s: DataLineageSource) => cfg[s.id]?.displayLabel || s.title;
  const targetFor = (s: DataLineageSource) => targetLabel(cfg[s.id]?.targetTable ?? s.targetTable);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sources
      .filter((s) => {
        if (!enabledFor(s.id)) return false; // 관리에서 숨김 처리
        if (approvedOnly && !s.id.startsWith("approved_")) return false;
        if (status === "ok" && s.status !== "downloaded") return false;
        if (status === "issue" && (s.status === "downloaded" || s.status === "cached")) return false;
        const surfaced = Boolean(screenFor(s.id));
        if (link === "surfaced" && !surfaced) return false;
        if (link === "unsurfaced" && surfaced) return false;
        if (needle) {
          const hay = `${labelFor(s)} ${s.provider} ${s.id} ${targetFor(s)}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 미연동·문제 항목을 위로(점검 우선), 그다음 행수.
        const aw = (screenFor(a.id) ? 0 : 1) + (a.status === "downloaded" ? 0 : 2);
        const bw = (screenFor(b.id) ? 0 : 1) + (b.status === "downloaded" ? 0 : 2);
        return bw - aw || (b.rowCount ?? 0) - (a.rowCount ?? 0);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, q, status, link, approvedOnly, cfg]);

  const visible = sources.filter((s) => enabledFor(s.id));
  const unsurfaced = visible.filter((s) => !screenFor(s.id)).length;
  const approved = visible.filter((s) => s.id.startsWith("approved_")).length;
  const hidden = sources.length - visible.length;

  return (
    <section className="surface">
      <div className="surface-header flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="surface-title">전체 수집 원본 ({visible.length})</h3>
          <p className="surface-subtitle">
            카테고리에 안 묶인 것까지 포함한 모든 수집 데이터셋. 미연동 {unsurfaced}건 · 에이전트 승인 {approved}건
            {hidden > 0 ? ` · 관리에서 숨김 ${hidden}건` : ""}.
          </p>
        </div>
      </div>

      {/* 검색·필터 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
        <label className="flex min-w-[180px] flex-1 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5">
          <Search aria-hidden size={14} className="shrink-0 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목·출처·대상 검색"
            className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none"
            aria-label="수집 원본 검색"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
          aria-label="상태 필터"
        >
          <option value="all">상태 전체</option>
          <option value="ok">수집 성공</option>
          <option value="issue">문제 있음</option>
        </select>
        <select
          value={link}
          onChange={(e) => setLink(e.target.value as LinkFilter)}
          className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
          aria-label="연동 필터"
        >
          <option value="all">연동 전체</option>
          <option value="surfaced">화면 연동</option>
          <option value="unsurfaced">미연동(수집만)</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={approvedOnly}
            onChange={(e) => setApprovedOnly(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          승인 후보만
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-2.5 text-left text-xs font-bold">데이터셋 · 출처</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold">상태</th>
              <th className="px-4 py-2.5 text-right text-xs font-bold">행수</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold">대상 도메인</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold">화면 연동</th>
              <th className="px-4 py-2.5 text-left text-xs font-bold">원본</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-muted" colSpan={6}>
                  조건에 맞는 수집 원본이 없습니다.
                </td>
              </tr>
            )}
            {rows.map((s) => {
              const badge = statusBadge(s.status);
              const screen = screenFor(s.id);
              const isApproved = s.id.startsWith("approved_");
              const inCatalog = catSet.has(s.id);
              return (
                <tr key={s.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-ink">{labelFor(s)}</span>
                      {isApproved && (
                        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">에이전트 승인</span>
                      )}
                      {!inCatalog && !isApproved && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">카탈로그 외</span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{s.provider}{s.updateCycle ? ` · ${s.updateCycle}` : ""}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.text}</span>
                    {s.reason && <p className="mt-0.5 max-w-[160px] text-[10px] leading-4 text-rose-600">{s.reason}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">
                    {s.rowCount != null ? s.rowCount.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{targetFor(s)}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {screen ? (
                      <span className="font-medium text-emerald-700">✓ {screen}</span>
                    ) : (
                      <span className="text-slate-400">미연동 (수집만)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.sourceUrl ? (
                      <a
                        href={s.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-xs text-teal-700 hover:underline"
                      >
                        링크 <ExternalLink size={11} aria-hidden />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] leading-5 text-muted">
        ‘미연동(수집만)’은 자동 수집·보관은 되지만 아직 전용 화면에 반영되지 않은 데이터입니다. ‘에이전트 승인’은 데이터
        에이전트가 발굴해 승인된 신규 소스입니다. 모두 집계 통계이며 개인식별정보를 포함하지 않습니다.
      </p>
    </section>
  );
}
