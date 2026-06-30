"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { realForeignContract } from "@/lib/data/generated/realData";

const PALETTE = ["#0f766e", "#3157a4", "#b45309", "#be123c", "#64748b", "#7c3aed"];

// 분포는 "정했음"(상위 합계) + 하위 기간구간("- ...") + "정하지 않았음" 으로 구성.
// 하위 기간구간만 추려 막대로 표시(라벨 앞 "- " 제거).
const subBands = realForeignContract.distribution
  .filter((d) => d.band.trim().startsWith("-"))
  .map((d) => ({ ...d, label: d.band.replace(/^\s*-\s*/, "") }));

// 근로기간 지정 유무(정했음 vs 정하지 않았음) 상위 2분류.
const fixedTermSet = realForeignContract.distribution.find((d) => d.band.trim() === "정했음");
const openTermSet = realForeignContract.distribution.find((d) => d.band.trim() === "정하지 않았음");

export const contractSummary = {
  latestYear: realForeignContract.latestYear,
  unit: realForeignContract.unit,
  fixedTerm: fixedTermSet?.value ?? 0,
  openTerm: openTermSet?.value ?? 0
};

/** 외국인 고용계약기간 — 근로기간 지정 하위 구간 분포(천명). */
export function ForeignContractChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (subBands.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="외국인 고용계약기간 분포 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={subBands}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} fontSize={11} width={120} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}천명`, "취업자"]}
          labelFormatter={(label) => `근로기간 ${label}`}
        />
        <Bar dataKey="value" name="취업자(천명)" radius={[0, 4, 4, 0]}>
          {subBands.map((entry, index) => (
            <Cell key={entry.band} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer></div>
  );
}
