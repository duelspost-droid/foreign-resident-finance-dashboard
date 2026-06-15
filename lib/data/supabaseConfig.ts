// Supabase 공개 연결 설정.
// URL 과 publishable(anon) 키는 브라우저에 노출되는 공개 안전 값이다
// (Supabase: "Publishable keys can be safely shared publicly").
// 데이터 보호는 RLS 정책으로 수행한다. service_role(sb_secret_) 키는 절대 여기 두지 않는다.
//
// 우선순위: 환경변수(NEXT_PUBLIC_*) 가 있으면 그것을, 없으면 아래 기본값을 사용.
export const SUPABASE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nrdapzgtibbusvoaceuh.supabase.co";

export const SUPABASE_PUBLIC_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_DckNy92c8WFGYWNPRsEjag_q-JQs9km";
