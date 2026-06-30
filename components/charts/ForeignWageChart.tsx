"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { realForeignWage } from "@/lib/data/generated/realData";

// 생성 데이터에 중복 행이 섞일 수 있어 band/year 기준으로 중복 제거.
function dedupeByKey<T extends Record<string, unknown>>(rows: readonly T[], key: keyof T): T[] {
  const seen = new Set<unknown>();
  const out: T[] = [];
  for (const row of rows) {
    const k = row[key];
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

const distribution = dedupeByKey(realForeignWage.distribution, "band").map((d) => ({
  ...d,
  // 긴 라벨을 짧게 — 축 가독성.
  shortBand: d.band
    .replace("100만원 미만", "~100만")
    .replace("100만원 이상 ~ 200만원 미만", "100~200만")
    .replace("200만원 이상 ~ 300만원 미만", "200~300만")
    .replace("300만원 이상", "300만~")
}));

const trend = dedupeByKey(realForeignWage.trend, "year");

/** 외국인 월평균 임금구간 분포 막대그래프(천명). */
export function ForeignWageDistributionChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (distribution.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="외국인 임금 분포 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={distribution} margin={{ top: 16, right: 18, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="shortBand" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}천명`, "취업자"]}
          labelFormatter={(label) => `월평균 임금 ${label}`}
        />
        <Bar dataKey="value" name="취업자(천명)" fill="#0f766e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer></div>
  );
}

/** 외국인 취업자 총계 연도 추세 라인(천명). */
export function ForeignWageTrendChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (trend.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <div role="img" aria-label="외국인 임금 합계 연도별 추이 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <LineChart data={trend} margin={{ top: 16, right: 20, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip formatter={(value) => [`${Number(value ?? 0).toLocaleString()}천명`, "취업자 총계"]} />
        <Line type="monotone" dataKey="value" name="취업자(천명)" stroke="#0f766e" strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer></div>
  );
}
