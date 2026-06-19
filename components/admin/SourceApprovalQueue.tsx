"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, ExternalLink, RefreshCw, ShieldCheck, X } from "lucide-react";
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
  "finance_segment_aggregate",
  "foreign_consumption_aggregate",
  "unclassified"
];

// 대상 테이블 → 사람이 읽는 한글 라벨(긴 영문 테이블명 대신 표시).
const TABLE_LABELS: Record<string, string> = {
  foreign_resident_region_month: "지역·월별 외국인",
  foreign_resident_status: "체류자격 현황",
  foreign_student_university: "유학생·대학",
  finance_segment_aggregate: "금융 세그먼트",
  foreign_consumption_aggregate: "소비·금융거래",
  unclassified: "기타·미분류 (수집·보관)"
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-teal-100 text-teal-800",
  rejected: "bg-slate-200 text-slate-500"
};

// 발굴 후보 승인 큐. compact=true 면 발굴 섹션 인라인용(처리이력·조사노트 미리보기 생략).
export function SourceApprovalQueue({ compact = false }: { compact?: boolean }) {
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
    <div className={compact ? "mt-3" : ""}>
      {/* 연결 상태 + 새로고침 */}
      <section className="surface flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck aria-hidden className="text-teal-700" size={16} />
          <span className="font-semibold text-ink">승인 대기 {connected ? `(${pending.length})` : ""}</span>
          {connected === null ? (
            <span className="text-muted">확인 중…</span>
          ) : connected ? (
            <span className="text-teal-700">Supabase 연결됨</span>
          ) : (
            <span className="text-amber-700">Supabase 미연결 (읽기 전용)</span>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw aria-hidden size={14} className={loading ? "animate-spin" : ""} /> 새로고침
        </button>
      </section>

      {/* 미연결 안내 */}
      {connected === false && (
        <section className="surface mt-4 flex gap-3 p-4">
          <AlertCircle aria-hidden className="mt-0.5 shrink-0 text-amber-600" size={18} />
          <div className="text-sm leading-6 text-slate-700">
            <p className="font-semibold text-ink">Supabase 데이터를 불러오지 못했습니다.</p>
            <p className="mt-1 text-muted">
              공개 연결 설정은 기본값으로 적용돼 있으므로, 대개{" "}
              <code>source_candidates</code> 테이블 미적용·RLS 권한·네트워크 문제입니다. 스키마 적용과 anon
              SELECT 정책을 확인하세요.
            </p>
          </div>
        </section>
      )}

      {/* 승인 대기 큐 */}
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

      {/* 처리 이력 (compact 아닐 때만) */}
      {!compact && connected && decided.length > 0 && (
        <section className="surface mt-4">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">처리 이력 ({decided.length})</h3>
              <p className="surface-subtitle">승인·거부 결정 기록</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-50">
            {decided.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-sm">
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[c.status]}`}>
                  {c.status === "approved" ? "승인" : "거부"}
                </span>
                <span className="min-w-0 max-w-full truncate font-medium text-ink">{c.title ?? c.datasetId}</span>
                <span className="truncate text-xs text-muted">
                  {c.provider} · {c.kind} · {c.datasetId}
                </span>
                {c.targetTable && (
                  <span className="ml-auto shrink-0 text-xs text-teal-700">→ {TABLE_LABELS[c.targetTable] ?? c.targetTable}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 미연결 시 조사 노트 미리보기 (compact 아닐 때만) */}
      {!compact && connected === false && (
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
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${c.registered ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-700"}`}>
                  {c.registered ? "등록됨" : "후속 검토"}
                </span>
                <span className="min-w-0 truncate font-medium text-ink">{c.title}</span>
                <span className="text-xs text-muted">{c.provider} · {c.ref}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
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
    <div className="px-4 py-3.5">
      {/* 제목(전체 표시) */}
      <p className="break-words text-sm font-semibold leading-snug text-ink">{c.title ?? c.datasetId}</p>

      {/* 메타 칩 */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{c.provider}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{c.kind}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-500">{c.datasetId}</span>
        {c.keyword && <span className="rounded bg-teal-50 px-1.5 py-0.5 text-teal-700">🔍 {c.keyword}</span>}
        {c.url && (
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-teal-700 hover:bg-slate-200"
          >
            원본 <ExternalLink size={10} aria-hidden />
          </a>
        )}
      </div>

      {c.rationale && <p className="mt-1.5 break-words text-xs text-slate-500">{c.rationale}</p>}

      {/* 액션 */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted">
          <span className="shrink-0">대상</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
            aria-label="대상 테이블"
          >
            {TARGET_TABLES.map((t) => (
              <option key={t} value={t}>
                {TABLE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => onDecide(c.id, "approved", target)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 sm:flex-none"
          >
            <Check aria-hidden size={14} /> 승인
          </button>
          <button
            disabled={busy}
            onClick={() => onDecide(c.id, "rejected")}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:flex-none"
          >
            <X aria-hidden size={14} /> 거부
          </button>
        </div>
      </div>

      {/* 대상 안내: 분류 태그이며, 맞는 도메인이 없으면 '기타·미분류'로 둬도 수집은 진행됨 */}
      <p className="mt-2 text-[11px] leading-5 text-slate-400">
        ‘대상’은 이 데이터가 들어갈 도메인 분류입니다. 맞는 도메인이 없으면 <strong className="text-slate-500">기타·미분류</strong>로
        두세요 — 승인하면 다음 배치에서 <strong className="text-slate-500">원본 수집·카탈로그 등록</strong>까지 진행되고,
        전용 화면 연동은 변환 로직 추가 후 활성화됩니다.
      </p>
    </div>
  );
}
