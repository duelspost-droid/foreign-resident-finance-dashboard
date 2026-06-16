"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from "recharts";

export type MiniBarPoint = { label: string; value: number };

const DEFAULT_COLORS = ["#0f766e", "#3157a4", "#b45309", "#be123c", "#7c3aed", "#64748b"];

export function MiniBarChart({
  data,
  unit = "",
  colors = DEFAULT_COLORS
}: {
  data: MiniBarPoint[];
  unit?: string;
  colors?: string[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-xs text-muted">차트 준비 중</div>;
  }

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-xs text-muted">데이터 없음</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={0} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}${unit}`, ""]}
          labelFormatter={(label) => `${label}`}
          cursor={{ fill: "rgba(15, 118, 110, 0.06)" }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell fill={colors[index % colors.length]} key={entry.label} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
