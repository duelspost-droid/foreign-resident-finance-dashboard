"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  DatabaseZap,
  Flag,
  Gauge,
  GraduationCap,
  Landmark,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  Map,
  ShieldCheck,
  ShoppingBag,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useMobileNav } from "./MobileNavContext";

// 축 1 · 금융 인사이트 (해석·전략)
const financeNav = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/financial-insights", label: "금융 인사이트", icon: Landmark },
];

// 축 2 · 분석 데이터 활용 (데이터 탐색)
const analysisNav = [
  { href: "/catalog", label: "데이터 카탈로그", icon: LayoutGrid },
  { href: "/nationalities", label: "국적 분석", icon: Flag },
  { href: "/visa-segments", label: "비자 세그먼트", icon: Layers },
  { href: "/regions", label: "지역 분석", icon: Map },
  { href: "/opportunity-scores", label: "기회 점수", icon: Target },
  { href: "/economy", label: "경제활동·소득", icon: BarChart3 },
  { href: "/universities", label: "유학생", icon: GraduationCap },
  { href: "/consumption", label: "소비·금융거래", icon: ShoppingBag },
];

const system = [
  { href: "/data-pipeline", label: "메타데이터 관리", icon: DatabaseZap },
  { href: "/admin/console", label: "운영 콘솔", icon: Gauge },
  { href: "/admin", label: "데이터 발굴 승인", icon: ShieldCheck },
  { href: "/compliance", label: "컴플라이언스·개인정보", icon: Lock },
];

export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen } = useMobileNav();

  // "/" 와 "/admin"(자식 라우트 /admin/console 보유)은 정확 일치로 처리해 중복 하이라이트 방지.
  const isActive = (href: string) =>
    href === "/" || href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* 모바일 드로어 배경(클릭 시 닫힘) */}
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
    <aside
      className={clsx(
        "flex flex-col border-r border-white/5 bg-[#0d1117] px-3 py-4 lg:min-h-screen",
        // 모바일: 오프캔버스 드로어 (데스크톱 lg+ 는 영향 없음)
        "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[82%] max-lg:max-w-[300px] max-lg:overflow-y-auto max-lg:shadow-2xl max-lg:transition-transform max-lg:duration-200",
        open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
      )}
    >
      {/* 모바일 닫기 버튼 */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="메뉴 닫기"
      >
        <X size={18} />
      </button>
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
    </>
  );
}
