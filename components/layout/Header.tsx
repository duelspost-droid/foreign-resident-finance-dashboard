"use client";

import { usePathname } from "next/navigation";
import { CalendarDays, ShieldCheck } from "lucide-react";

const pageNames: Record<string, string> = {
  "/": "개요",
  "/dashboard": "개요",
  "/regions": "지역 분석",
  "/nationalities": "국적 분석",
  "/universities": "대학/유학생 분석",
  "/visa-segments": "체류자격 분석",
  "/opportunity-scores": "금융 기회 점수",
  "/data-sources": "데이터 소스",
  "/compliance": "개인정보/컴플라이언스"
};

export function Header() {
  const pathname = usePathname();
  const title = pageNames[pathname] ?? "대시보드";

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 backdrop-blur">
      <div>
        <p className="text-xs font-semibold text-teal-700">국내거주 외국인 금융 인사이트</p>
        <h1 className="text-base font-bold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <span className="hidden items-center gap-1 rounded-md border border-slate-200 px-2 py-1 sm:flex">
          <CalendarDays aria-hidden size={14} />
          기준월 2025.12
        </span>
        <span className="flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-teal-800">
          <ShieldCheck aria-hidden size={14} />
          집계 데이터
        </span>
      </div>
    </header>
  );
}
