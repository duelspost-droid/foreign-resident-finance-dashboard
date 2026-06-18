"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getSessionId } from "@/lib/utils/session";
import { logPageView } from "@/lib/data/supabaseClient";
import { SUPABASE_PUBLIC_ANON_KEY, SUPABASE_PUBLIC_URL } from "@/lib/data/supabaseConfig";

const ENABLED = Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_ANON_KEY);

// 외부 유입 도메인만 추출(전체 URL/파라미터 미저장). 동일 출처/없음 → null.
function referrerHost(): string | null {
  try {
    if (!document.referrer) return null;
    const u = new URL(document.referrer);
    if (u.host === window.location.host) return null;
    return u.host;
  } catch {
    return null;
  }
}

// 익명 페이지뷰 기록(fire-and-forget). 관리자/운영 경로는 통계 왜곡 방지를 위해 제외.
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!ENABLED || !pathname) return;
    if (pathname.startsWith("/admin")) return;
    if (last.current === pathname) return; // 같은 경로 중복 방지(StrictMode·리렌더)
    last.current = pathname;
    void logPageView({ sessionId: getSessionId(), path: pathname, referrerHost: referrerHost() });
  }, [pathname]);

  return null;
}
