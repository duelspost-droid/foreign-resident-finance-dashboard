"use client";

import { useMemo, useState } from "react";
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
import { BarChart3, Table2 } from "lucide-react";
import type { GenericSource } from "@/lib/data/generated/genericData";

// 관리자가 '홈에 표시' 시 고르는 차트 설정(surface_config.note 에 JSON 저장). 없으면 자동 추론.
export type ChartConfig = {
  type?: "bar" | "line" | "table";
  cat?: number; // 범주(라벨) 컬럼 인덱스
  val?: number; // 수치 컬럼 인덱스
  title?: string;
};

export function parseChartConfig(note: string | null | undefined): ChartConfig {
  if (!note) return {};
  try {
    const c = JSON.parse(note);
    return c && typeof c === "object" ? (c as ChartConfig) : {};
  } catch {
    return {};
  }
}

// 어떤 수집 소스든 범용으로 차트/표 렌더. config 가 있으면 그대로, 없으면 자동 추론. 차트 부적합 시 표 폴백.
export function GenericSourceChart({
  title,
  provider,
  source,
  config = {}
}: {
  title: string;
  provider?: string;
  source: GenericSource;
  config?: ChartConfig;
}) {
  const { columns, rows, numericCols, rowCount } = source;

  const autoCat = useMemo(() => {
    const i = columns.findIndex((_, idx) => !numericCols.includes(idx));
    return i >= 0 ? i : 0;
  }, [columns, numericCols]);
  const autoVal = numericCols.find((i) => i !== autoCat) ?? numericCols[0] ?? -1;

  const catIdx = config.cat != null && config.cat < columns.length ? config.cat : autoCat;
  const valIdx = config.val != null && config.val < columns.length ? config.val : autoVal;
  const heading = config.title?.trim() || title;
  const chartKind = config.type ?? "bar";
  const canChart = chartKind !== "table" && valIdx >= 0 && rows.length > 0;

  const [view, setView] = useState<"chart" | "table">(chartKind === "table" ? "table" : "chart");
  const effectiveView = canChart ? view : "table";

  const chartData = useMemo(() => {
    if (!canChart) return [];
    const mapped = rows
      .map((r) => ({ name: r[catIdx] || "—", value: Number(String(r[valIdx]).replace(/,/g, "")) || 0 }))
      .filter((d) => Number.isFinite(d.value));
    // 막대: 값 큰 순 상위 12 / 선: 행 순서(추이) 상위 40
    return chartKind === "line"
      ? mapped.slice(0, 40)
      : mapped.filter((d) => d.value !== 0).sort((a, b) => b.value - a.value).slice(0, 12);
  }, [rows, catIdx, valIdx, canChart, chartKind]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{heading}</p>
          {provider && (
            <p className="text-[11px] text-slate-400">
              {provider} · 원본 {rowCount.toLocaleString()}행 (미리보기 {rows.length})
            </p>
          )}
        </div>
        {canChart && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setView("chart")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${effectiveView === "chart" ? "bg-teal-50 text-teal-700" : "text-slate-400 hover:bg-slate-50"}`}
            >
              <BarChart3 size={12} aria-hidden /> 차트
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${effectiveView === "table" ? "bg-teal-50 text-teal-700" : "text-slate-400 hover:bg-slate-50"}`}
            >
              <Table2 size={12} aria-hidden /> 표
            </button>
          </div>
        )}
      </div>

      {effectiveView === "chart" ? (
        <>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartKind === "line" ? (
                <LineChart data={chartData} margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={2} dot={false} name={columns[valIdx]} />
                </LineChart>
              ) : (
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} name={columns[valIdx]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {columns[catIdx]}별 {columns[valIdx]} · {chartKind === "line" ? "추이" : `상위 ${chartData.length}`}
          </p>
        </>
      ) : (
        <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-slate-100">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className={`whitespace-nowrap px-2 py-1.5 font-semibold text-slate-600 ${numericCols.includes(i) ? "text-right" : "text-left"}`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t border-slate-50">
                  {columns.map((_, ci) => (
                    <td
                      key={ci}
                      className={`whitespace-nowrap px-2 py-1 text-slate-700 ${numericCols.includes(ci) ? "text-right tabular-nums" : "text-left"}`}
                    >
                      {r[ci]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
