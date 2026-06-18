// 관리자 콘솔 경량 패스코드 게이트(로그인 없음 모델).
// ⚠️ 클라이언트 측 검증 — 완벽한 보안이 아니다(우연한 접근 차단용).
//    진짜 보안은 Supabase Auth + RLS가 필요하며, 데이터 자체는 anon 키로도 접근 가능하다.
// 값: 패스코드 문자열의 SHA-256 hex. 미설정 시 게이트 비활성(경고 표시 후 통과).
export const ADMIN_PASSCODE_HASH = process.env.NEXT_PUBLIC_ADMIN_PASSCODE_HASH || "";

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
