"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Ctx = { open: boolean; setOpen: (v: boolean) => void; toggle: () => void };
const MobileNavCtx = createContext<Ctx>({ open: false, setOpen: () => {}, toggle: () => {} });
export const useMobileNav = () => useContext(MobileNavCtx);

// 모바일 사이드바(오프캔버스 드로어) 열림 상태 공유. 라우트 이동 시 자동 닫힘.
export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  return (
    <MobileNavCtx.Provider value={{ open, setOpen, toggle: () => setOpen((v) => !v) }}>
      {children}
    </MobileNavCtx.Provider>
  );
}
