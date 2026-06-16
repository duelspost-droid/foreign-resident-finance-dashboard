"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
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
import { realBopTransferIncome, realExchangeRate } from "@/lib/data/generated/realData";

function NotReady({ empty }: { empty: boolean }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      {empty ? "데이터 없음" : "차트 준비 중"}
    </div>
  );
}

/** 이전소득수지(본국송금 거시 대리) 연도별 추세 — 백만달러. */
export function BopTransferIncomeChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = [...realBopTransferIncome.annual];
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={52} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()} 백만달러`, "이전소득수지"]}
          labelFormatter={(label) => `${label}년`}
        />
        <Bar dataKey="value" name="이전소득수지(백만달러)" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.year} fill="#3157a4" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 이전소득수지 월별(최근 36개월) 추세 — 백만달러. */
export function BopTransferMonthlyChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = [...realBopTransferIncome.monthly];
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
        <defs>
          <linearGradient id="bopFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#0f766e" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={52} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()} 백만달러`, "이전소득수지"]}
          labelFormatter={(label) => String(label)}
        />
        <Area type="monotone" dataKey="value" name="이전소득수지(백만달러)" stroke="#0f766e" strokeWidth={2} fill="url(#bopFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** 원/달러 환율 월말 추세(최근 24개월). */
export function ExchangeRateChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = realExchangeRate.monthly.map((m) => ({ month: m.month, usd: m.usd }));
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} minTickGap={20} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} domain={["dataMin - 30", "dataMax + 30"]} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()} 원`, "원/달러"]}
          labelFormatter={(label) => String(label)}
        />
        <Line type="monotone" dataKey="usd" name="원/달러(월말)" stroke="#be123c" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
