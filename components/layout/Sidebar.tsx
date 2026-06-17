"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DatabaseZap,
  Flag,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Map,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";

const navigation = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/financial-insights", label: "금융 인사이트", icon: Landmark },
  { href: "/regions", label: "지역 분석", icon: Map },
  { href: "/nationalities", label: "국적 분석", icon: Flag },
  { href: "/universities", label: "대학/유학생", icon: GraduationCap },
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

      {/* 메인 메뉴 */}
      <div className="mb-1 px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
        분석
      </div>
      <nav className="grid gap-0.5" aria-label="분석 메뉴">
        {navigation.map((item) => {
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
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 시스템 메뉴 */}
      <div className="mb-1 mt-5 px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/25">
        시스템
      </div>
      <nav className="grid gap-0.5" aria-label="시스템 메뉴">
        {system.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Icon
                aria-hidden
                size={16}
                className={clsx("shrink-0 transition-colors", active ? "text-teal-400" : "text-white/30 group-hover:text-white/50")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 면책 */}
      <div className="mt-auto px-3 pt-6">
        <p className="text-[10px] leading-relaxed text-white/20">
          집계 통계만 사용 · 개인식별정보 없음
        </p>
      </div>
    </aside>
  );
}
