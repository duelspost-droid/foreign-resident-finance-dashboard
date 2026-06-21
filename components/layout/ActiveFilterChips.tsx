"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import type { ActiveFilters } from "@/lib/filters/filterParams";
import { FILTER_META } from "@/lib/filters/filterParams";

const CHIP_COLORS: Record<string, { bg: string; border: string; text: string; btn: string }> = {
  teal:   { bg: "bg-teal-50",   border: "border-teal-200",  text: "text-teal-700",  btn: "hover:bg-teal-100" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-700",  btn: "hover:bg-blue-100" },
  violet: { bg: "bg-violet-50", border: "border-violet-200",text: "text-violet-700",btn: "hover:bg-violet-100" },
};

export function ActiveFilterChips() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const active: Array<{ key: keyof ActiveFilters; label: string; value: string; color: string }> = [];
  for (const key of Object.keys(FILTER_META) as Array<keyof ActiveFilters>) {
    const value = searchParams.get(key);
    if (value && value !== "전체") {
      active.push({ key, label: FILTER_META[key].label, value, color: FILTER_META[key].color });
    }
  }

  if (active.length === 0) return null;

  const remove = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const clearAll = () => {
    startTransition(() => router.push(pathname, { scroll: false }));
  };

  return (
    <div
      className={[
        "flex items-center gap-1.5 transition-opacity duration-150",
        isPending ? "opacity-50" : "",
      ].join(" ")}
    >
      {active.map(({ key, label, value, color }) => {
        const c = CHIP_COLORS[color] ?? CHIP_COLORS.teal;
        return (
          <span
            key={key}
            className={[
              "flex items-center gap-1 rounded-full border py-0.5 pl-2.5 pr-1 text-[11px] font-semibold",
              c.bg, c.border, c.text,
            ].join(" ")}
          >
            <span className="opacity-60">{label}:</span>
            {value}
            <button
              onClick={() => remove(key)}
              className={[
                "ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors",
                c.btn,
              ].join(" ")}
              aria-label={`${label} 필터 해제`}
            >
              <X size={9} />
            </button>
          </span>
        );
      })}
      {active.length > 1 && (
        <button
          onClick={clearAll}
          className="px-1 text-[11px] text-slate-400 transition-colors hover:text-slate-600"
        >
          전체 해제
        </button>
      )}
    </div>
  );
}
