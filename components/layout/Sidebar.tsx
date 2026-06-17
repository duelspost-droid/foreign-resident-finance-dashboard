"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  DatabaseZap,
  Flag,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Map,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

// 축 1 · 금융 인사이트 (해석·전략)
const financeNav = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/financial-insights", label: "금융 인사이트", icon: Landmark },
];

// 축 2 · 분석 데이터 활용 (데이터 탐색)
const analysisNav = [
  { href: "/catalog", label: "데이터 카탈로그", icon: LayoutGrid },
  { href: "/nationalities", label: "국적 분석", icon: Flag },
  { href: "/regions", label: "지역 분석", icon: Map },
  { href: "/economy", label: "경제활동·소득", icon: BarChart3 },
  { href: "/universities", label: "유학생", icon: GraduationCap },
  { href: "/consumption", label: "소비·금융거래", icon: ShoppingBag },
];

const system = [
  { href: "/data-pipeline", label: "데이터 관리", icon: DatabaseZap },
  { href: "/admin", label: "관리자", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex flex-col border-r border-white/5 bg-[#0d1117] px-3 py-4 lg:min-h-screen">
      {/* 로고 — JB×AX 브랜드 마크 (맛집 트래커와 동일 패턴: 골드 그라데이션 ×AX) */}
      <Link href="/" className="mb-6 flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-lg shadow-blue-900/40"
          style={{ background: "linear-gradient(135deg, #155BFF, #061A40)" }}
        >
          <TrendingUp size={18} className="text-white" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-extrabold leading-tight tracking-tight text-white">
            JB
            <span
              className="font-black"
              style={{
                background: "linear-gradient(90deg, #ffd54a, #ffb300)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              ×AX
            </span>
          </span>
          <span className="block text-[12px] font-semibold leading-tight text-white/85">외국인 금융 인사이트</span>
        </span>
      </Link>

      {/* 2축 메뉴: 금융 인사이트 / 분석 데이터 활용 / 시스템 */}
      {[
        { title: "금융 인사이트", axis: "축 1", items: financeNav, accent: "text-amber-300/80" },
        { title: "분석 데이터 활용", axis: "축 2", items: analysisNav, accent: "text-teal-300/80" },
        { title: "시스템", axis: "", items: system, accent: "text-white/25" }
      ].map((group, gi) => (
        <div key={group.title} className={gi === 0 ? "" : "mt-5"}>
          <div className="mb-1 flex items-center gap-1.5 px-3 pb-1">
            {group.axis && (
              <span className={clsx("text-[9px] font-bold uppercase tracking-widest", group.accent)}>{group.axis}</span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{group.title}</span>
          </div>
          <nav className="grid gap-0.5" aria-label={group.title}>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "group flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  )}
                >
                  <Icon
                    aria-hidden
                    size={16}
                    className={clsx("shrink-0 transition-colors", active ? "text-teal-400" : "text-white/30 group-hover:text-white/50")}
                  />
                  <span>{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      {/* 하단 면책 */}
      <div className="mt-auto px-3 pt-6">
        <p className="text-[10px] leading-relaxed text-white/20">
          집계 통계만 사용 · 개인식별정보 없음
        </p>
      </div>
    </aside>
  );
}
