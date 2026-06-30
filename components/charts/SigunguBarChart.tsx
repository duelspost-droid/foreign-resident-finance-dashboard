"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatNumber } from "@/lib/utils/format";

const TOP_N = 20;
const COLORS = [
  "#0f766e", "#1a8a7e", "#0369a1", "#0480b8", "#3157a4",
  "#3d6ab5", "#1e7a6a", "#0d6b6b", "#b45309", "#c46210",
  "#7c3aed", "#6d32d1", "#be123c", "#d01545", "#64748b",
  "#7a8da0", "#047857", "#059669", "#854d0e", "#92530f"
];

// data 는 서버(페이지)에서 regionAggregates.realSigunguResidents 를 주입 — 거대 realData 모듈을 클라 번들에서 분리.
export function SigunguBarChart({ data }: { data: readonly { sigungu: string; count: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const chartData = data.slice(0, TOP_N).map((r, i) => ({
    sigungu: r.sigungu,
    count: r.count,
    color: COLORS[i % COLORS.length],
  }));

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="시군구별 외국인 규모 막대 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 72, bottom: 4, left: 64 }}
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f4f8" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          fontSize={10}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}천`}
        />
        <YAxis
          type="category"
          dataKey="sigungu"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={60}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          formatter={(value) => [`${formatNumber(value as number)}명`, "등록외국인"]}
          labelFormatter={(label) => String(label)}
        />
        <Bar dataKey="count" name="등록외국인" radius={[0, 4, 4, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.sigungu} fill={entry.color} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fontSize: 10, fill: "#64748b" }}
            formatter={(v) => formatNumber(v as number)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer></div>
  );
}
