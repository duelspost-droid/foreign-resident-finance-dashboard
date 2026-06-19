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

/** 주요국 대원화 환율 월말 추세(최근 24개월) — USD/CNY/JPY/EUR 토글. */
const FX_META = {
  usd: { label: "원/달러", color: "#be123c" },
  cny: { label: "원/위안", color: "#0f766e" },
  jpy: { label: "원/엔(100엔)", color: "#3157a4" },
  eur: { label: "원/유로", color: "#b45309" }
} as const;
type FxKey = keyof typeof FX_META;

export function ExchangeRateChart() {
  const [mounted, setMounted] = useState(false);
  const [currency, setCurrency] = useState<FxKey>("usd");
  useEffect(() => setMounted(true), []);
  const data = realExchangeRate.monthly.map((m) => ({
    month: m.month,
    usd: m.usd,
    cny: m.cny,
    jpy: m.jpy,
    eur: m.eur
  }));
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  const meta = FX_META[currency];

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 px-1" role="group" aria-label="환율 통화 선택">
        {(Object.keys(FX_META) as FxKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setCurrency(k)}
            aria-pressed={currency === k}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
              currency === k
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {k.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} minTickGap={20} />
            <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} domain={["dataMin - 30", "dataMax + 30"]} />
            <Tooltip
              formatter={(value) => [`${Number(value ?? 0).toLocaleString()} 원`, meta.label]}
              labelFormatter={(label) => String(label)}
            />
            <Line type="monotone" dataKey={currency} name={`${meta.label}(월말)`} stroke={meta.color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
