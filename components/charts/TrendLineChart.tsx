"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { monthlyTrendData } from "@/lib/data/mockData";

export function TrendLineChart({
  data = monthlyTrendData
}: {
  data?: typeof monthlyTrendData;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }

  return (
    <div role="img" aria-label="월별 추세 선형 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 16, right: 20, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}명`, ""]}
        />
        <Legend />
        <Line type="monotone" dataKey="중국" stroke="#0f766e" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="베트남" stroke="#3157a4" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="우즈베키스탄"
          stroke="#b45309"
          strokeWidth={2}
          dot={false}
        />
        <Line type="monotone" dataKey="몽골" stroke="#be123c" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer></div>
  );
}
