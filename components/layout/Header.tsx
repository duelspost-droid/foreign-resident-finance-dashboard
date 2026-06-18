"use client";

import { usePathname } from "next/navigation";
import { realDataSummary } from "@/lib/data/generated/realData";
import { DataFreshnessChip } from "@/components/ui/DataFreshness";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

const pageNames: Record<string, { title: string; sub: string }> = {
  "/":                    { title: "대시보드",       sub: "핵심 지표 한눈에 보기" },
  "/financial-insights":  { title: "금융 인사이트",   sub: "시장 기회·지역 전략·유스케이스" },
  "/catalog":             { title: "데이터 카탈로그", sub: "수집 데이터셋 색인 · 카테고리별" },
  "/nationalities":       { title: "국적 분석",      sub: "국적·연령별 체류 현황" },
  "/regions":             { title: "지역 분석",      sub: "시도별 외국인 분포 및 기회 점수" },
  "/economy":             { title: "경제활동·소득",   sub: "임금·고용·산업·연령·EPS·건강보험" },
  "/universities":        { title: "유학생",         sub: "유학생 추이·국적·대학·시도" },
  "/consumption":         { title: "소비·금융거래",   sub: "면세점·부동산·본국송금·환율" },
  "/data-pipeline":       { title: "데이터 관리",     sub: "수집 파이프라인 및 발굴 현황" },
  "/admin/console":       { title: "운영 콘솔",       sub: "제안 답변 · 접속통계 · 방문자" },
  "/admin":               { title: "관리자",         sub: "신규 데이터 소스 승인" },
};

export function Header() {
  const pathname = usePathname();
  const page = pageNames[pathname] ?? { title: pathname.split("/").at(-1) ?? "페이지", sub: "" };

  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 border-b border-slate-100 bg-white/90 px-6 backdrop-blur-sm">
      {/* 페이지 제목 */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-[15px] font-bold text-slate-900">{page.title}</h1>
        {page.sub && (
          <>
            <span className="text-slate-300">/</span>
            <span className="hidden text-xs text-slate-400 sm:block">{page.sub}</span>
          </>
        )}
      </div>

      {/* 우측: 제안하기 버튼 + 데이터 수집일·신선도(뷰 시점 실시간 판정) */}
      <div className="flex items-center gap-2">
        <FeedbackButton />
        <DataFreshnessChip generatedAt={realDataSummary.generatedAt} />
      </div>
    </header>
  );
}
