// AI 인사이트 질의 이력.
// 1순위: Supabase(ai_insight_chat) — 기기 간 영속(세션 id 단위).
// 폴백: 브라우저 localStorage — Supabase 미연결/테이블 미배포 시에도 이력 보존.
import { deleteChatHistory, fetchChatHistory, insertChatEntry } from "@/lib/data/supabaseClient";

export type ChatEntry = {
  id: string;
  question: string;
  answer: string;
  source: "ai" | "data";
  ts: number;
  topics?: string[];
  pages?: string[];
};

const KEY = "jbax-insight-chat-history-v1";
const SID_KEY = "jbax-insight-session-id";
const MAX = 100;

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// 기기 단위 세션 id(이력 소유자 식별). 없으면 생성·저장.
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let s = window.localStorage.getItem(SID_KEY);
    if (!s) {
      s = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return "anon";
  }
}

function loadLocal(): ChatEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(list: ChatEntry[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // best-effort
  }
}

// 이력 로드: Supabase 우선, 실패 시 localStorage. Supabase 결과는 로컬 캐시에도 저장.
export async function loadHistory(): Promise<ChatEntry[]> {
  const remote = await fetchChatHistory(getSessionId(), MAX).catch(() => null);
  if (remote) {
    const list: ChatEntry[] = remote.map((r) => ({
      id: String(r.id),
      question: r.question,
      answer: r.answer,
      source: r.source === "ai" ? "ai" : "data",
      ts: new Date(r.created_at).getTime(),
      pages: Array.isArray(r.pages) ? r.pages : []
    }));
    saveLocal(list);
    return list;
  }
  return loadLocal();
}

// 이력 저장: localStorage 즉시 반영 + Supabase best-effort. 갱신된 목록 반환.
export async function saveEntry(entry: ChatEntry): Promise<ChatEntry[]> {
  const list = [entry, ...loadLocal()].slice(0, MAX);
  saveLocal(list);
  void insertChatEntry({
    sessionId: getSessionId(),
    question: entry.question,
    answer: entry.answer,
    source: entry.source,
    pages: entry.pages ?? []
  }).catch(() => false);
  return list;
}

// 이력 삭제: localStorage + Supabase 양쪽.
export async function clearHistory(): Promise<void> {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  await deleteChatHistory(getSessionId()).catch(() => false);
}
