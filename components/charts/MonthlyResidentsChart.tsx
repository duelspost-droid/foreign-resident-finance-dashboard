"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

// data 는 서버(페이지)에서 realMonthlyResidents.months 를 주입.
export function MonthlyResidentsChart({ data }: { data: readonly { month: string; total: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">데이터 없음</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={[...data]} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={28} />
        <YAxis
          tick={{ fontSize: 11 }}
          width={48}
          domain={["auto", "auto"]}
          tickFormatter={(v) => `${Math.round((v as number) / 10000)}만`}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toLocaleString()}명`, "체류외국인"]}
          labelFormatter={(l) => String(l)}
        />
        <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={2} dot={false} name="체류외국인" />
      </LineChart>
    </ResponsiveContainer>
  );
}
