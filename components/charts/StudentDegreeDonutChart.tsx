"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

// 학위과정별 유학생 분포 도넛. VisaDonutChart 패턴(client + mounted 가드)을 따름.
const COLORS = [
  "#0f766e",
  "#3157a4",
  "#b45309",
  "#be123c",
  "#0891b2",
  "#7c3aed",
  "#64748b",
  "#9333ea",
  "#16a34a",
  "#d97706",
  "#475569",
  "#db2777"
];

export function StudentDegreeDonutChart({
  data,
  colors = COLORS
}: {
  data: { degree: string; value: number }[];
  colors?: string[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 준비 중</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="degree"
          cx="50%"
          cy="50%"
          innerRadius={62}
          outerRadius={104}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell fill={colors[index % colors.length]} key={entry.degree} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${Number(value ?? 0).toLocaleString()}명`, String(name)]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
