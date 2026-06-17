"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { History, Send, Sparkles, Trash2, X } from "lucide-react";
import { answerLocally, buildContextText } from "@/lib/ai/insightEngine";
import { type ChatEntry, clearHistory, loadHistory, newId, saveEntry } from "@/lib/ai/chatHistory";
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "@/lib/data/supabaseConfig";

type Msg = { role: "user" | "assistant"; content: string; source?: "ai" | "data"; pages?: string[] };

const EXAMPLES = [
  "유학생 국적 1위는?",
  "외국인 임금 분포 알려줘",
  "본국송금 추세는?",
  "면세점 소비 최대 국적은?",
  "어느 지역에 외국인이 밀집해 있나?"
];

const AI_ENABLED = Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_ANON_KEY);

// 생성형 LLM(Supabase Edge Function) 호출. 미설정/실패 시 null 반환 → 로컬 엔진 폴백.
async function askLlm(question: string, context: string, history: { q: string; a: string }[]): Promise<string | null> {
  if (!AI_ENABLED) return null;
  try {
    const res = await fetch(`${SUPABASE_PUBLIC_URL}/functions/v1/insight-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLIC_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLIC_ANON_KEY}`
      },
      body: JSON.stringify({ question, context, history })
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { answer?: string };
    return data.answer?.trim() || null;
  } catch {
    return null;
  }
}

export function InsightChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadHistory().then(setHistory);
  }, []);
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);

    const recent = messages
      .reduce<{ q: string; a: string }[]>((acc, msg, i, arr) => {
        if (msg.role === "user" && arr[i + 1]?.role === "assistant") acc.push({ q: msg.content, a: arr[i + 1].content });
        return acc;
      }, [])
      .slice(-4);

    const llm = await askLlm(q, buildContextText(), recent);
    let answer: string;
    let source: "ai" | "data";
    let pages: string[] = [];
    if (llm) {
      answer = llm;
      source = "ai";
    } else {
      const local = answerLocally(q);
      answer = local.answer;
      source = "data";
      pages = local.pages;
    }

    setMessages((m) => [...m, { role: "assistant", content: answer, source, pages }]);
    setHistory(await saveEntry({ id: newId(), question: q, answer, source, pages, ts: Date.now() }));
    setLoading(false);
  }

  function recall(e: ChatEntry) {
    setMessages((m) => [
      ...m,
      { role: "user", content: e.question },
      { role: "assistant", content: e.answer, source: e.source, pages: e.pages }
    ]);
    setShowHistory(false);
  }

  return (
    <div className="surface flex flex-col overflow-hidden">
      <div className="surface-header items-center pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: "linear-gradient(135deg,#155BFF,#061A40)" }}>
            <Sparkles size={16} aria-hidden />
          </span>
          <div>
            <h3 className="surface-title text-sm">AI 인사이트 어시스턴트</h3>
            <p className="surface-subtitle">{AI_ENABLED ? "생성형 AI · 수집 데이터 기반 답변" : "데이터 기반 답변 · 생성형 AI 연동 대기"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <History size={13} aria-hidden /> 이력 {history.length > 0 && <span className="text-teal-600">{history.length}</span>}
        </button>
      </div>

      {showHistory && (
        <div className="border-b border-line bg-slate-50/60 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">과거 질문 (클릭해 다시 보기)</span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => { void clearHistory(); setHistory([]); }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600"
              >
                <Trash2 size={11} aria-hidden /> 전체 삭제
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-slate-400">아직 질문 이력이 없습니다.</p>
          ) : (
            <ul className="max-h-44 space-y-1 overflow-y-auto">
              {history.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => recall(e)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-white"
                  >
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${e.source === "ai" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>
                      {e.source === "ai" ? "AI" : "데이터"}
                    </span>
                    <span className="truncate text-slate-700">{e.question}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-slate-400">
                      {new Date(e.ts).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div ref={threadRef} className="max-h-[420px] min-h-[180px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">외국인 금융 데이터에 대해 질문해 보세요. 예시:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => ask(ex)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-teal-300 hover:text-teal-700"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-teal-600 px-3.5 py-2 text-sm text-white"
                  : "max-w-[90%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800"
              }
            >
              {m.role === "assistant" && (
                <span className={`mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${m.source === "ai" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>
                  {m.source === "ai" ? "AI 생성" : "데이터 기반"}
                </span>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              {m.pages && m.pages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.pages.map((p) => (
                    <Link key={p} href={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-teal-700 hover:bg-slate-200">
                      자세히: {p}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-400">
              분석 중<span className="animate-pulse">…</span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(input); }}
        className="flex items-center gap-2 border-t border-line px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예) 중국 유학생은 몇 명? 외국인 송금 추세는?"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
          aria-label="질문 입력"
        />
        {input && (
          <button type="button" onClick={() => setInput("")} className="shrink-0 text-slate-300 hover:text-slate-500" aria-label="지우기">
            <X size={16} />
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Send size={14} aria-hidden /> 질의
        </button>
      </form>
    </div>
  );
}
