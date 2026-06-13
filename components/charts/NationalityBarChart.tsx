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
import { nationalityDistributionData } from "@/lib/data/mockData";

export function NationalityBarChart({
  data = nationalityDistributionData
}: {
  data?: typeof nationalityDistributionData;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 18, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="nationality" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => [
            `${Number(value ?? 0).toLocaleString()}명`,
            "거주자 수"
          ]}
          labelFormatter={(label) => `${label} 국적`}
        />
        <Bar dataKey="residents" name="거주자 수" fill="#0f766e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
