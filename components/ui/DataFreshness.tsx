"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, RefreshCw } from "lucide-react";
import { computeFreshness } from "@/lib/utils/freshness";

// 뷰 시점의 현재 시각(분 단위 갱신). 마운트 전엔 null → 하이드레이션 불일치 방지.
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── 헤더용 컴팩트 칩 ──────────────────────────────────────────────────────────────
export function DataFreshnessChip({ generatedAt }: { generatedAt: string }) {
  const now = useNow();
  const date = generatedAt.slice(0, 10);
  if (now == null) {
    return (
      <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
        <CalendarDays size={12} aria-hidden /> 수집일 {date}
      </span>
    );
  }
  const f = computeFreshness(generatedAt, now);
  return (
    <span
      className="flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold"
      style={{ color: f.color, borderColor: f.border, background: f.bg }}
      title={`${f.detail} (마지막 수집: ${new Date(generatedAt).toLocaleString("ko-KR")})`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: f.color }} aria-hidden />
      수집일 {date}
      <span className="hidden font-medium opacity-80 sm:inline">· {f.level === "fresh" ? f.ageText : f.label}</span>
    </span>
  );
}

// ── 홈 신선도 배너 (신선도에 따라 색이 바뀜) ──────────────────────────────────────────
export function DataFreshnessBanner({
  generatedAt,
  totalRows,
  loadedDatasets,
  datasetTotal = 8
}: {
  generatedAt: string;
  totalRows: number;
  loadedDatasets: number;
  datasetTotal?: number;
}) {
  const now = useNow();
  const date = generatedAt.slice(0, 10);
  const f = now == null ? null : computeFreshness(generatedAt, now);
  const color = f?.color ?? "#475569";
  const bg = f?.bg ?? "#f8fafc";
  const border = f?.border ?? "#e2e8f0";

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-4 py-2.5 text-xs"
      style={{ background: bg, border: `1px solid ${border}`, color }}
      title={f?.detail}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      <span>
        수집 기준일 <strong>{date}</strong>
        {f && <> · {f.level === "fresh" ? `${f.ageText} 반영` : f.label}</>}
      </span>
      <span className="opacity-40">·</span>
      <span>누적 {totalRows.toLocaleString()}행</span>
      <span className="opacity-40">·</span>
      <span>실데이터셋 {loadedDatasets}/{datasetTotal} 적재</span>
      <span className="opacity-40">·</span>
      <span>매일 01:00 KST 자동 갱신</span>
    </div>
  );
}

// ── 데이터 관리(운영) 상세 패널 ───────────────────────────────────────────────────
export function DataFreshnessPanel({ generatedAt }: { generatedAt: string }) {
  const now = useNow();
  const lastBuild = new Date(generatedAt);
  const lastBuildText = Number.isNaN(lastBuild.getTime()) ? "—" : lastBuild.toLocaleString("ko-KR");

  if (now == null) {
    return (
      <section className="surface mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <RefreshCw aria-hidden className="text-slate-400" size={16} />
          <span className="font-semibold text-ink">데이터 갱신 상태</span>
          <span className="text-muted">확인 중…</span>
        </div>
      </section>
    );
  }

  const f = computeFreshness(generatedAt, now);
  const ageDetail =
    f.hours < 24 ? `약 ${Math.round(f.hours)}시간 전` : `${f.days}일 전`;

  return (
    <section
      className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl px-4 py-3.5"
      style={{ background: f.bg, border: `1px solid ${f.border}` }}
    >
      <div className="flex items-center gap-2.5">
        {f.level === "fresh" ? (
          <CheckCircle2 aria-hidden size={20} style={{ color: f.color }} />
        ) : (
          <RefreshCw aria-hidden size={20} style={{ color: f.color }} />
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">데이터 갱신 상태</p>
          <p className="text-base font-black leading-tight" style={{ color: f.color }}>
            {f.label}
          </p>
        </div>
      </div>

      <div className="text-sm">
        <p className="text-[11px] text-muted">마지막 수집</p>
        <p className="font-semibold text-ink">
          {lastBuildText} <span className="font-normal text-muted">({ageDetail})</span>
        </p>
      </div>

      <div className="text-sm">
        <p className="text-[11px] text-muted">예상 주기</p>
        <p className="font-semibold text-ink">매일 01:00 KST</p>
      </div>

      <p className="ml-auto max-w-xs text-xs leading-5" style={{ color: f.color }}>
        {f.detail}
      </p>
    </section>
  );
}
