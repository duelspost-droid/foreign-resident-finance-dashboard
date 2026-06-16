"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  realForeignAgeActivity,
  realForeignEmploymentStatus,
  realForeignIndustry
} from "@/lib/data/generated/realData";

const PALETTE = ["#0f766e", "#3157a4", "#b45309", "#be123c", "#64748b", "#7c3aed", "#0891b2", "#65a30d"];

function NotReady({ empty }: { empty: boolean }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      {empty ? "데이터 없음" : "차트 준비 중"}
    </div>
  );
}

/** 종사상지위별 외국인 취업자 분포(천명) — 상용/임시·일용/자영업/무급가족. */
export function EmploymentStatusChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = [...realForeignEmploymentStatus.distribution];
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis type="category" dataKey="status" tickLine={false} axisLine={false} fontSize={11} width={120} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}천명`, "취업자"]}
          labelFormatter={(label) => String(label)}
        />
        <Bar dataKey="value" name="취업자(천명)" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.status} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 산업별 외국인 취업자 분포(천명) — 금융은 '전기·운수·통신·금융'에 포함. */
export function IndustryEmploymentChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = [...realForeignIndustry.distribution];
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis type="category" dataKey="industry" tickLine={false} axisLine={false} fontSize={11} width={140} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}천명`, "취업자"]}
          labelFormatter={(label) => String(label)}
        />
        <Bar dataKey="value" name="취업자(천명)" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.industry} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 연령대별 외국인 취업자(천명, 막대) + 고용률(%, 선). */
export function AgeActivityChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = [...realForeignAgeActivity.distribution];
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="ageBand" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={11} unit="%" domain={[0, 100]} />
        <Tooltip
          formatter={(value, name) =>
            name === "고용률"
              ? [`${Number(value ?? 0).toLocaleString()}%`, name]
              : [`${Number(value ?? 0).toLocaleString()}천명`, name]
          }
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="left" dataKey="employed" name="취업자(천명)" fill="#0f766e" radius={[4, 4, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="employmentRate" name="고용률" stroke="#be123c" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
