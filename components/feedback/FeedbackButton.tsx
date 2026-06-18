"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Database, Lightbulb, MessageSquarePlus, Send, X } from "lucide-react";
import { getSessionId } from "@/lib/utils/session";
import { categoryMeta, statusMeta } from "@/lib/feedback";
import {
  type FeatureRequestRow,
  fetchPublicFeatureRequests,
  submitFeatureRequest
} from "@/lib/data/supabaseClient";
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "@/lib/data/supabaseConfig";

const ENABLED = Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_ANON_KEY);

export function FeedbackButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "history">("new");
  const [category, setCategory] = useState<"feature" | "data">("feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | "ok" | "fail">(null);
  const [history, setHistory] = useState<FeatureRequestRow[] | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // 모달 열림 동안: Esc 닫기 + 배경 스크롤 잠금 + 제목 입력 초기 포커스, 닫을 때 트리거로 포커스 복귀.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
      triggerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    // 과거 제안 이력 = 전체 공개(로그인 없음). 표시용 컬럼만 조회(데이터 최소화).
    if (open && tab === "history") {
      setHistory(null); // 로딩 표시
      void fetchPublicFeatureRequests(300).then((r) => setHistory(r ?? []));
    }
  }, [open, tab]);

  async function submit() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    setResult(null);
    const ok = await submitFeatureRequest({
      sessionId: getSessionId(),
      category,
      title: t,
      body: body.trim(),
      page: pathname
    });
    setBusy(false);
    setResult(ok ? "ok" : "fail");
    if (ok) {
      setTitle("");
      setBody("");
      setTab("history"); // 접수 직후 공개 이력으로 전환해 방금 등록한 항목을 바로 확인
    }
  }

  if (!ENABLED) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(true); setTab("new"); setResult(null); }}
        className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-semibold text-teal-700 transition hover:bg-teal-100"
        title="기능·데이터 제안하기"
      >
        <MessageSquarePlus size={14} aria-hidden />
        <span className="hidden sm:inline">제안하기</span>
      </button>

      {open && (
        // 오버레이 자체를 스크롤 가능하게(overflow-y-auto) → 짧은 뷰포트·낮은 노트북에서도 하단 '제안 접수' 버튼에 항상 도달.
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-8 backdrop-blur-sm sm:pt-16" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="frfd-feedback-title"
            className="flex max-h-[calc(100dvh-4rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: "linear-gradient(135deg,#2dd4bf,#0f766e)" }}>
                  <MessageSquarePlus size={16} aria-hidden />
                </span>
                <div>
                  <h3 id="frfd-feedback-title" className="text-sm font-bold text-slate-900">기능·데이터 제안</h3>
                  <p className="text-[11px] text-slate-500">원하는 기능이나 추가했으면 하는 데이터를 알려주세요.</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="닫기">
                <X size={18} />
              </button>
            </div>

            {/* 탭 */}
            <div className="flex shrink-0 gap-1 border-b border-slate-100 px-4 pt-2">
              {([["new", "제안하기"], ["history", "과거 제안 이력"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`rounded-t-lg px-3 py-2 text-xs font-semibold ${tab === k ? "border-b-2 border-teal-600 text-teal-700" : "text-slate-400 hover:text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "new" ? (
              // 입력 영역은 스크롤, '제안 접수' 버튼은 하단 고정 → 작은 화면에서도 버튼이 항상 보임
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {/* 카테고리 */}
                  <div className="flex gap-2">
                    {([["feature", "기능 제안", Lightbulb], ["data", "데이터 요청", Database]] as const).map(([k, label, Icon]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCategory(k)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${category === k ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                      >
                        <Icon size={14} aria-hidden /> {label}
                      </button>
                    ))}
                  </div>
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    placeholder="제목 (예: 국적별 송금 추세 그래프 추가)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="상세 내용 (선택) — 어떤 분석/데이터가 왜 필요한지 적어주세요."
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  />
                  <p className="text-[11px] leading-4 text-slate-400">
                    제안은 로그인 없이 익명으로 접수되며, 접수된 제안은 <b>‘과거 제안 이력’에서 누구나</b> 볼 수 있어요. 이름·연락처 등 개인정보는 적지 마세요.
                  </p>
                  {result === "ok" && <p className="rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">접수됐습니다. ‘과거 제안 이력’에서 처리 상태와 답변을 확인할 수 있어요.</p>}
                  {result === "fail" && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">접수에 실패했습니다. 잠시 후 다시 시도해 주세요.</p>}
                </div>
                <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-3">
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy || !title.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    <Send size={14} aria-hidden /> {busy ? "접수 중…" : "제안 접수"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
                {history === null ? (
                  <p className="py-6 text-center text-sm text-slate-400">불러오는 중…</p>
                ) : history.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">아직 등록된 제안이 없습니다. 첫 제안을 남겨보세요.</p>
                ) : (
                  history.map((r) => {
                    const s = statusMeta(r.status);
                    const c = categoryMeta(r.category);
                    return (
                      <div key={r.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s.tone}`}>{s.label}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.tone}`}>{c.label}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{r.title}</span>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {new Date(r.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        {r.body && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{r.body}</p>}
                        {r.admin_response ? (
                          <div className="mt-2 rounded-md bg-teal-50 p-2 text-xs text-teal-800">
                            <span className="font-bold">관리자 답변</span>
                            <p className="mt-0.5 whitespace-pre-wrap">{r.admin_response}</p>
                          </div>
                        ) : r.status === "answered" || r.status === "rejected" ? (
                          <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-500">
                            {r.status === "rejected" ? "검토 후 이번에는 반영하지 않기로 했어요." : "처리 완료되었습니다."}
                          </p>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
