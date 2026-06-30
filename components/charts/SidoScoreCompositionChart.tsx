"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { RealSidoOpportunity } from "@/lib/data/opportunityReal";

const SHORT: Record<string, string> = {
  "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구",
  "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전",
  "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
  "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남",
  "전북특별자치도": "전북", "전라남도": "전남", "경상북도": "경북",
  "경상남도": "경남", "제주특별자치도": "제주",
};

const LABEL_MAP: Record<string, string> = {
  sizeContrib: "규모 기여 (×50%)",
  studentContrib: "유학생 기여 (×30%)",
  growthContrib: "성장 기여 (×20%)",
};

// rows·weights 는 서버(페이지)에서 opportunityReal 에서 주입 — 거대 realData 모듈을 클라 번들에서 분리.
export function SidoScoreCompositionChart({
  rows,
  weights
}: {
  rows: readonly RealSidoOpportunity[];
  weights: { size: number; student: number; growth: number };
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const chartData = [...rows]
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((r) => ({
      sido: SHORT[r.sido] ?? r.sido,
      sizeContrib: Math.round((r.sizeScore * weights.size) / 100),
      studentContrib: Math.round((r.studentScore * weights.student) / 100),
      growthContrib: Math.round((r.growthScore * weights.growth) / 100),
      overall: r.overallScore,
    }));

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (chartData.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="시도별 기회 점수 구성 누적 막대 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 52, bottom: 4, left: 36 }}
        barCategoryGap="28%"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f4f8" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          fontSize={10}
          tickCount={6}
        />
        <YAxis
          type="category"
          dataKey="sido"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          formatter={(value, name) => [`${value}점`, LABEL_MAP[name as string] ?? String(name)]}
          labelFormatter={(label) => `${label} · 기회점수 구성`}
        />
        <Bar dataKey="sizeContrib" name="sizeContrib" stackId="a" fill="#0f766e" />
        <Bar dataKey="studentContrib" name="studentContrib" stackId="a" fill="#3157a4" />
        <Bar dataKey="growthContrib" name="growthContrib" stackId="a" fill="#be123c" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="overall"
            position="right"
            style={{ fontSize: 11, fontWeight: 700, fill: "#374151" }}
            formatter={(v) => `${v}`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer></div>
  );
}
