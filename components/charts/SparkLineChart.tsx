"use client";

import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis
} from "recharts";

export type SparkPoint = { label: string | number; value: number };

export function SparkLineChart({
  data,
  color = "#0f766e",
  unit = ""
}: {
  data: SparkPoint[];
  color?: string;
  unit?: string;
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
      <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}${unit}`, ""]}
          labelFormatter={(label) => `${label}`}
        />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
