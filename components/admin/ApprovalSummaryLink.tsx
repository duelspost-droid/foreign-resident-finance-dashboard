"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { fetchSourceCandidates } from "@/lib/data/supabaseClient";

// 메타데이터 관리(파이프라인)에서 보여줄 '발굴 승인' 요약 + 링크.
// 실제 승인/거부 액션은 전용 페이지 '데이터 에이전트 승인'(/admin) 한 곳에서만 처리한다(중복 제거).
export function ApprovalSummaryLink() {
  const [pending, setPending] = useState<number | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    void fetchSourceCandidates().then((rows) => {
      setConnected(rows !== null);
      setPending((rows ?? []).filter((c) => c.status === "pending").length);
    });
  }, []);

  const sub =
    connected === null
      ? "확인 중…"
      : connected
        ? pending && pending > 0
          ? "검토 후 대상 테이블을 지정해 승인하세요"
          : "대기 중인 후보가 없습니다"
        : "Supabase 미연결 — 연결 시 승인 큐가 활성화됩니다";

  return (
    <Link
      href="/admin"
      className="surface surface-hover flex items-center justify-between gap-4 px-4 py-3 no-underline"
    >
      <div className="flex min-w-0 items-center gap-3">
        <ShieldCheck aria-hidden className="shrink-0 text-teal-700" size={18} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
            데이터 에이전트 승인
            {connected && pending !== null && pending > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                승인 대기 {pending}건
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-700">
        승인하러 가기 <ArrowRight aria-hidden size={13} />
      </span>
    </Link>
  );
}
