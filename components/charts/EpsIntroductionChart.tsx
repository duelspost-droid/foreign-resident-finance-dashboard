"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { realEpsIntroduction } from "@/lib/data/generated/realData";

const PALETTE = ["#0f766e", "#3157a4", "#b45309", "#be123c", "#64748b", "#7c3aed"];

// 상위 국가만(top 10) — 막대 가독성. 값 내림차순 가정이나 안전하게 정렬.
const byCountry = [...realEpsIntroduction.byCountry]
  .sort((a, b) => b.value - a.value)
  .slice(0, 10);

const byIndustry = [...realEpsIntroduction.byIndustry].sort((a, b) => b.value - a.value);

const trend = [...realEpsIntroduction.trend].sort((a, b) => a.year - b.year);

/** E-9 국가별 도입 top 막대그래프(명). */
export function EpsByCountryChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (byCountry.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="EPS 국가별 외국인력 도입 분포 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={byCountry} margin={{ top: 16, right: 18, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="country" tickLine={false} axisLine={false} fontSize={11} interval={0} angle={-30} textAnchor="end" height={48} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}명`, "도입 인원"]}
          labelFormatter={(label) => `${label}`}
        />
        <Bar dataKey="value" name="도입 인원(명)" fill="#3157a4" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer></div>
  );
}

/** E-9 연도별 도입 합계 추세 라인(명). */
export function EpsTrendChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (trend.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="EPS 외국인력 도입 연도별 추이 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <LineChart data={trend} margin={{ top: 16, right: 20, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip formatter={(value) => [`${Number(value ?? 0).toLocaleString()}명`, "연간 도입"]} />
        <Line type="monotone" dataKey="value" name="연간 도입(명)" stroke="#b45309" strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer></div>
  );
}

/** E-9 업종별 분포 가로 막대(명). */
export function EpsByIndustryChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (byIndustry.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="EPS 업종별 외국인력 도입 분포 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={byIndustry}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 12 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis type="category" dataKey="industry" tickLine={false} axisLine={false} fontSize={12} width={64} />
        <Tooltip formatter={(value) => [`${Number(value ?? 0).toLocaleString()}명`, "도입 인원"]} />
        <Bar dataKey="value" name="도입 인원(명)" radius={[0, 4, 4, 0]}>
          {byIndustry.map((entry, index) => (
            <Cell key={entry.industry} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer></div>
  );
}
