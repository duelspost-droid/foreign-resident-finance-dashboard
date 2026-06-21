"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";

type FilterKey = "sido" | "nationality" | "segment";

type FilterDef = {
  key: FilterKey;
  label: string;
  options: string[];
};

export function FilterBar({
  sidoOptions,
  nationalityOptions,
  segmentOptions,
}: {
  sidoOptions: string[];
  nationalityOptions: string[];
  segmentOptions: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const filters: FilterDef[] = [
    { key: "sido",        label: "시도",      options: sidoOptions },
    { key: "nationality", label: "국적",      options: nationalityOptions },
    { key: "segment",     label: "세그먼트",  options: segmentOptions },
  ];

  const handleChange = useCallback(
    (key: FilterKey, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "전체") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [router, searchParams, pathname]
  );

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-slate-100 bg-slate-50/70 px-4 py-2 sm:px-6",
        "transition-opacity duration-150",
        isPending ? "opacity-60" : "opacity-100",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <SlidersHorizontal size={12} />
        필터
      </span>

      {filters.map((f) => {
        const current = searchParams.get(f.key) ?? "전체";
        const isActive = current !== "전체";
        return (
          <label key={f.key} className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-500">{f.label}</span>
            <select
              value={current}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className={[
                "h-7 cursor-pointer rounded-md border px-2 text-[12px] font-medium outline-none",
                "transition-all duration-150",
                "focus:outline-none focus:ring-1",
                isActive
                  ? "border-teal-400 bg-teal-50 text-teal-800 ring-teal-200 focus:ring-teal-300"
                  : "border-slate-200 bg-white text-slate-600 focus:border-teal-400 focus:ring-teal-100",
              ].join(" ")}
            >
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
}
