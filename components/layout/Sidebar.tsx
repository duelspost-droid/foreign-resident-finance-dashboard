"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Database,
  DatabaseZap,
  FileText,
  Flag,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Map,
  PieChart,
  ShieldCheck
} from "lucide-react";
import clsx from "clsx";

const navigation = [
  { href: "/", label: "개요", icon: LayoutDashboard },
  { href: "/financial-insights", label: "금융 인사이트", icon: Landmark },
  { href: "/regions", label: "지역 분석", icon: Map },
  { href: "/nationalities", label: "국적 분석", icon: Flag },
  { href: "/universities", label: "대학/유학생", icon: GraduationCap },
  { href: "/visa-segments", label: "체류자격 분석", icon: PieChart },
  { href: "/opportunity-scores", label: "금융 기회 점수", icon: BarChart3 },
  { href: "/data-sources", label: "데이터 소스", icon: Database },
  { href: "/data-pipeline", label: "수집 파이프라인", icon: DatabaseZap },
  { href: "/admin", label: "관리자 승인", icon: ShieldCheck },
  { href: "/compliance", label: "컴플라이언스", icon: FileText }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-r border-slate-200 bg-white px-4 py-5 lg:min-h-screen">
      <Link href="/" className="flex items-center gap-3 rounded-md px-2 py-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-700 text-white">
          <Building2 aria-hidden size={22} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink">Foreign Resident</span>
          <span className="block text-xs text-muted">Finance Intelligence</span>
        </span>
      </Link>

      <nav className="mt-6 grid gap-1" aria-label="주요 메뉴">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              href={item.href}
              key={item.href}
              className={clsx(
                "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon aria-hidden size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">
        개인 단위 외국인 정보는 수집하지 않습니다. 모든 수치는 공개 통계 또는 집계
        데이터 기준입니다.
      </div>
    </aside>
  );
}
