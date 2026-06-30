"use client";

import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { scoreRadarData } from "@/lib/data/mockData";

export function ScoreRadarChart({
  data = scoreRadarData
}: {
  data?: typeof scoreRadarData;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }

  return (
    <div role="img" aria-label="기회 점수 구성 레이더 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="74%">
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Radar
          dataKey="안산시"
          stroke="#0f766e"
          fill="#0f766e"
          fillOpacity={0.18}
          strokeWidth={2}
        />
        <Radar
          dataKey="구로구"
          stroke="#3157a4"
          fill="#3157a4"
          fillOpacity={0.14}
          strokeWidth={2}
        />
        <Radar
          dataKey="동대문구"
          stroke="#be123c"
          fill="#be123c"
          fillOpacity={0.12}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer></div>
  );
}
