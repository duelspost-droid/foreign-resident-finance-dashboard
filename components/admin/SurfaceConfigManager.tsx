"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, Save, Search } from "lucide-react";
import { dataLineage, type DataLineageSource } from "@/lib/data/generated/dataLineage";
import { SURFACED, TARGET_TABLES, targetLabel } from "@/lib/data/sourceMeta";
import {
  fetchSurfaceConfig,
  upsertSurfaceConfig,
  type SurfaceConfigRow
} from "@/lib/data/supabaseClient";

type Draft = { screen: string; label: string; enabled: boolean; target: string };

// 소스별 "대시보드 반영 설정"을 편집해 Supabase(surface_config)에 저장하는 관리 UI.
// 저장 즉시 공개 화면(수집 원본 뷰어 등)이 런타임에 읽어 반영한다.
export function SurfaceConfigManager() {
  const sources = useMemo(() => [...dataLineage.sources], []);
  const [config, setConfig] = useState<Record<string, SurfaceConfigRow> | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchSurfaceConfig();
    setConnected(rows !== null);
    const map: Record<string, SurfaceConfigRow> = {};
    for (const r of rows ?? []) map[r.sourceId] = r;
    setConfig(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 소스의 현재 적용값(설정 override → 없으면 하드코딩 기본).
  const effective = useCallback(
    (s: DataLineageSource): Draft => {
      const c = config?.[s.id];
      return {
        screen: c?.screen ?? SURFACED[s.id] ?? "",
        label: c?.displayLabel ?? "",
        enabled: c?.enabled ?? true,
        target: c?.targetTable ?? s.targetTable ?? "unclassified"
      };
    },
    [config]
  );

  const draftFor = (s: DataLineageSource): Draft => drafts[s.id] ?? effective(s);
  const setDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] ?? effective(sources.find((s) => s.id === id)!)), ...patch } }));

  async function save(s: DataLineageSource) {
    const d = draftFor(s);
    setSavingId(s.id);
    const ok = await upsertSurfaceConfig({
      sourceId: s.id,
      screen: d.screen.trim() || null,
      displayLabel: d.label.trim() || null,
      enabled: d.enabled,
      targetTable: d.target || null
    });
    setSavingId(null);
    if (ok) {
      await load();
      setDrafts((m) => {
        const { [s.id]: _omit, ...rest } = m;
        return rest;
      });
      setSavedId(s.id);
      setTimeout(() => setSavedId((v) => (v === s.id ? null : v)), 1500);
    }
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return sources;
    return sources.filter((s) => `${s.title} ${s.provider} ${s.id}`.toLowerCase().includes(needle));
  }, [sources, q]);

  return (
    <div className="space-y-4">
      <section className="surface flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="text-sm font-semibold text-ink">대시보드 반영 설정 ({sources.length})</span>
        {connected === null ? (
          <span className="text-sm text-muted">확인 중…</span>
        ) : connected ? (
          <span className="text-sm text-teal-700">Supabase 연결됨 · 저장 즉시 반영</span>
        ) : (
          <span className="text-sm text-amber-700">surface_config 테이블 미적용 (006 마이그레이션 필요)</span>
        )}
        <button
          type="button"
          onClick={load}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw aria-hidden size={14} className={loading ? "animate-spin" : ""} /> 새로고침
        </button>
      </section>

      <label className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5">
        <Search aria-hidden size={14} className="shrink-0 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="소스 검색(제목·출처·id)"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
          aria-label="소스 검색"
        />
      </label>

      <p className="text-[11px] leading-5 text-muted">
        ‘연동 화면’·‘표시’·‘라벨’은 저장 즉시 공개 화면(수집 원본 뷰어 등)에 반영됩니다. 빈 ‘연동 화면’은 미연동(수집만)으로
        표시되며, 새 데이터의 실제 차트 연동은 변환 로직 추가 후 다음 배치에서 적용됩니다.
      </p>

      <div className="space-y-2.5">
        {rows.map((s) => {
          const d = draftFor(s);
          const dirty = Boolean(drafts[s.id]);
          return (
            <div key={s.id} className="surface p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-[11px] text-muted">
                    {s.provider} · <span className="font-mono">{s.id}</span> · 현재 대상 {targetLabel(s.targetTable)}
                    {s.id.startsWith("approved_") ? " · 에이전트 승인" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingId === s.id || !dirty}
                  onClick={() => save(s)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
                >
                  {savedId === s.id ? <Check size={13} aria-hidden /> : <Save size={13} aria-hidden />}
                  {savedId === s.id ? "저장됨" : savingId === s.id ? "저장 중…" : "저장"}
                </button>
              </div>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  연동 화면
                  <input
                    value={d.screen}
                    onChange={(e) => setDraft(s.id, { screen: e.target.value })}
                    placeholder="예: 지역 분석 (빈칸=미연동)"
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  표시 라벨(선택)
                  <input
                    value={d.label}
                    onChange={(e) => setDraft(s.id, { label: e.target.value })}
                    placeholder="기본: 소스 제목"
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  대상 도메인
                  <select
                    value={d.target}
                    onChange={(e) => setDraft(s.id, { target: e.target.value })}
                    className="rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
                  >
                    {TARGET_TABLES.map((t) => (
                      <option key={t} value={t}>{targetLabel(t)}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 self-end pb-1 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={d.enabled}
                    onChange={(e) => setDraft(s.id, { enabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                  공개 표시
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
