"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, RefreshCw, ShieldCheck, X } from "lucide-react";
import {
  fetchSourceCandidates,
  updateCandidateStatus,
  type SourceCandidate
} from "@/lib/data/supabaseClient";
import { candidateSources } from "@/lib/data/researchNotes";

const TARGET_TABLES = [
  "foreign_resident_region_month",
  "foreign_resident_status",
  "foreign_student_university",
  "finance_segment_aggregate"
];

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-teal-100 text-teal-800",
  rejected: "bg-slate-200 text-slate-500"
};

export default function AdminPage() {
  const [candidates, setCandidates] = useState<SourceCandidate[] | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchSourceCandidates();
    setConnected(rows !== null);
    setCandidates(rows ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: number, status: "approved" | "rejected", targetTable?: string) {
    setBusyId(id);
    const ok = await updateCandidateStatus(id, status, { targetTable });
    if (ok) await load();
    setBusyId(null);
  }

  const pending = (candidates ?? []).filter((c) => c.status === "pending");
  const decided = (candidates ?? []).filter((c) => c.status !== "pending");

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">관리자</p>
        <h2 className="page-title">데이터 출처 승인</h2>
        <p className="page-description">
          매일 배치가 자동 발굴한 신규 데이터셋 후보를 검토하고 승인/거부합니다. 승인된 후보는 다음
          수집 배치에서 자동으로 등록·수집됩니다.
        </p>
      </section>

      {/* 연결 상태 */}
      <section className="surface flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck aria-hidden className="text-teal-700" size={16} />
          <span className="font-semibold text-ink">승인 큐</span>
          {connected === null ? (
            <span className="text-muted">확인 중…</span>
          ) : connected ? (
            <span className="text-teal-700">Supabase 연결됨</span>
          ) : (
            <span className="text-amber-700">Supabase 미연결 (읽기 전용 후보 목록 표시)</span>
          )}
        </div>
        <button
          onClick={load}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw aria-hidden size={14} /> 새로고침
        </button>
      </section>

      {/* 미연결 안내 */}
      {connected === false && (
        <section className="surface mt-4 flex gap-3 p-4">
          <AlertCircle aria-hidden className="mt-0.5 shrink-0 text-amber-600" size={18} />
          <div className="text-sm leading-6 text-slate-700">
            <p className="font-semibold text-ink">Supabase 환경변수가 설정되지 않았습니다.</p>
            <p className="mt-1 text-muted">
              승인 기능을 켜려면 <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 를 설정하고 <code>supabase/schema.sql</code> 의
              <code> source_candidates</code> 테이블을 적용하세요. 아래는 조사 노트 기반 후보 미리보기입니다.
            </p>
          </div>
        </section>
      )}

      {/* 연결 시: 승인 대기 큐 */}
      {connected && (
        <section className="surface mt-4">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">승인 대기 ({pending.length})</h3>
              <p className="surface-subtitle">검토 후 대상 테이블을 지정해 승인하세요</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {loading && <p className="p-4 text-sm text-muted">불러오는 중…</p>}
            {!loading && pending.length === 0 && (
              <p className="p-4 text-sm text-muted">대기 중인 후보가 없습니다.</p>
            )}
            {pending.map((c) => (
              <CandidateRow key={c.id} c={c} busy={busyId === c.id} onDecide={decide} />
            ))}
          </div>
        </section>
      )}

      {/* 연결 시: 처리 이력 */}
      {connected && decided.length > 0 && (
        <section className="surface mt-4">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">처리 이력 ({decided.length})</h3>
              <p className="surface-subtitle">승인·거부 결정 기록</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-50">
            {decided.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[c.status]}`}>
                  {c.status === "approved" ? "승인" : "거부"}
                </span>
                <span className="font-medium text-ink">{c.title ?? c.datasetId}</span>
                <span className="text-xs text-muted">
                  {c.provider} · {c.kind} · {c.datasetId}
                </span>
                {c.targetTable && (
                  <span className="ml-auto text-xs text-teal-700">→ {c.targetTable}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 미연결 시: 조사 노트 후보 미리보기 (읽기 전용) */}
      {connected === false && (
        <section className="surface mt-4">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">조사 노트 후보 (미리보기)</h3>
              <p className="surface-subtitle">Supabase 연결 시 승인 큐로 전환됩니다</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-50">
            {candidateSources.map((c) => (
              <li key={c.provider + c.ref} className="flex flex-wrap items-center gap-2 px-4 py-2 text-sm">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    c.registered ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {c.registered ? "등록됨" : "후속 검토"}
                </span>
                <span className="font-medium text-ink">{c.title}</span>
                <span className="text-xs text-muted">{c.provider} · {c.ref}</span>
                <span className="ml-auto text-xs text-slate-500">{c.rationale}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function CandidateRow({
  c,
  busy,
  onDecide
}: {
  c: SourceCandidate;
  busy: boolean;
  onDecide: (id: number, status: "approved" | "rejected", targetTable?: string) => void;
}) {
  const [target, setTarget] = useState(c.targetTable ?? TARGET_TABLES[0]);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{c.title ?? c.datasetId}</p>
        <p className="text-xs text-muted">
          {c.provider} · {c.kind} · {c.datasetId}
          {c.keyword ? ` · 키워드: ${c.keyword}` : ""}
        </p>
        {c.rationale && <p className="mt-0.5 text-xs text-slate-500">{c.rationale}</p>}
      </div>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700"
        aria-label="대상 테이블"
      >
        {TARGET_TABLES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button
        disabled={busy}
        onClick={() => onDecide(c.id, "approved", target)}
        className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
      >
        <Check aria-hidden size={14} /> 승인
      </button>
      <button
        disabled={busy}
        onClick={() => onDecide(c.id, "rejected")}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        <X aria-hidden size={14} /> 거부
      </button>
    </div>
  );
}
