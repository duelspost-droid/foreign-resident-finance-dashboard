"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { realDutyFreeSales, realForeignLandAcquisition } from "@/lib/data/generated/realData";

const PALETTE = ["#be123c", "#b45309", "#0f766e", "#3157a4", "#7c3aed", "#0891b2", "#65a30d", "#64748b"];

function NotReady({ empty }: { empty: boolean }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      {empty ? "데이터 없음" : "차트 준비 중"}
    </div>
  );
}

/** 면세점 외국인 국적별 매출(억원) — JDC 지정면세점. */
export function DutyFreeNationalityChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = realDutyFreeSales.byNationality.map((n) => ({ nationality: n.nationality, value: Math.round((n.value / 1e8) * 10) / 10 }));
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} unit="억" />
        <YAxis type="category" dataKey="nationality" tickLine={false} axisLine={false} fontSize={11} width={64} />
        <Tooltip formatter={(value) => [`${Number(value ?? 0).toLocaleString()} 억원`, "면세점 매출"]} />
        <Bar dataKey="value" name="면세점 매출(억원)" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.nationality} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 외국인 국적별 토지 취득금액(억원) — 제주특별자치도. */
export function ForeignLandNationalityChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // 원자료 단위 백만원 → 억원(÷100).
  const data = realForeignLandAcquisition.byNationality.map((n) => ({ nationality: n.nationality, value: Math.round((n.value / 100) * 10) / 10 }));
  if (!mounted) return <NotReady empty={false} />;
  if (data.length === 0) return <NotReady empty />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} unit="억" />
        <YAxis type="category" dataKey="nationality" tickLine={false} axisLine={false} fontSize={11} width={110} />
        <Tooltip formatter={(value) => [`${Number(value ?? 0).toLocaleString()} 억원`, "토지 취득금액"]} />
        <Bar dataKey="value" name="토지 취득금액(억원)" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.nationality} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
