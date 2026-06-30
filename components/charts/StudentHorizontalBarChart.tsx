"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

// 유학생 실데이터용 수평 막대(긴 라벨: 국적/시도 대응). NationalityBarChart 패턴을 따름.
export function StudentHorizontalBarChart({
  data,
  labelKey,
  fill = "#0f766e",
  unit = "명",
  seriesName = "유학생"
}: {
  data: { label: string; value: number }[];
  labelKey?: string;
  fill?: string;
  unit?: string;
  seriesName?: string;
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
    <div role="img" aria-label="유학생 분포 가로 막대 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => Number(v).toLocaleString()} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={96}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}${unit}`, seriesName]}
          labelFormatter={(label) => `${label}${labelKey ? ` ${labelKey}` : ""}`}
        />
        <Bar dataKey="value" name={seriesName} fill={fill} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer></div>
  );
}
