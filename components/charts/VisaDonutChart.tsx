"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { visaDistributionData } from "@/lib/data/mockData";
import { DONUT_PALETTE as colors } from "@/lib/theme/chartPalette";

export function VisaDonutChart({
  data = visaDistributionData
}: {
  data?: typeof visaDistributionData;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center text-sm text-muted">차트 준비 중</div>;
  }

  return (
    <div role="img" aria-label="체류자격(비자) 세그먼트 분포 도넛 차트" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={68}
          outerRadius={108}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell fill={colors[index % colors.length]} key={entry.name} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${Number(value ?? 0)}%`, "비중"]} />
      </PieChart>
    </ResponsiveContainer></div>
  );
}
