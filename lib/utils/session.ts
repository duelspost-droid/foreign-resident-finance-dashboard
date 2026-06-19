// 익명 방문자 세션 id (localStorage). AI 질의 이력과 동일 키를 써서 동일 방문자로 일관 식별.
// 개인식별정보 아님 — 랜덤 문자열.
const SID_KEY = "jbax-insight-session-id";

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
