// AI 인사이트 질의 이력 — 브라우저 localStorage 영속화(정적 사이트, 백엔드 불필요).
// Supabase 연동 시 서버 동기화로 확장 가능하나, 기본은 기기 단위 이력 보존.
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
const MAX = 100;

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadHistory(): ChatEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: ChatEntry): ChatEntry[] {
  const list = [entry, ...loadHistory()].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 용량 초과 등 — 무시(이력은 best-effort)
  }
  return list;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
