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
import { maskSmallCell } from "@/lib/utils/format";

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

// ID성/연도성 컬럼명 — 값(측정치)으로 자동 선택하면 무의미하므로 제외.
const ID_LIKE_RE = /번호|일련|순번|연번|코드|행번|연도|year|^년$|^no\.?$|^id$|seq|index|rownum/i;
const isIdLike = (name: string | undefined) => ID_LIKE_RE.test((name ?? "").trim());

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
  // 값 컬럼: ID/연도성 컬럼은 제외하고 고름(없으면 일반 수치 컬럼으로 폴백).
  const autoVal = useMemo(() => {
    const valueCols = numericCols.filter((i) => i !== autoCat && !isIdLike(columns[i]));
    return valueCols[0] ?? numericCols.find((i) => i !== autoCat) ?? numericCols[0] ?? -1;
  }, [numericCols, autoCat, columns]);

  // config 인덱스는 0 이상 & 범위 내일 때만 사용(음수·범위초과 가드).
  const inRange = (n: number | undefined) => n != null && n >= 0 && n < columns.length;
  const catIdx = inRange(config.cat) ? (config.cat as number) : autoCat;
  const valIdx = inRange(config.val) ? (config.val as number) : autoVal;
  const heading = config.title?.trim() || title;
  const chartKind = config.type ?? "bar";

  const chartData = useMemo(() => {
    if (chartKind === "table" || valIdx < 0 || rows.length === 0) return [];
    const mapped = rows
      // 표와 동일하게 소수 셀(1~4)은 마스킹 대상 → 차트로 정확값이 노출되지 않도록 데이터 포인트에서 제외.
      .filter((r) => !maskSmallCell(r[valIdx]).masked)
      .map((r) => ({ name: r[catIdx] || "—", value: Number(String(r[valIdx] ?? "").replace(/,/g, "")) || 0 }))
      .filter((d) => Number.isFinite(d.value));
    // 막대: 값 큰 순 상위 12 / 선: 행 순서(추이) 상위 40
    return chartKind === "line"
      ? mapped.slice(0, 40)
      : mapped.filter((d) => d.value !== 0).sort((a, b) => b.value - a.value).slice(0, 12);
  }, [rows, catIdx, valIdx, chartKind]);

  // 차트 데이터가 비었거나 전부 0이면 차트 대신 표로 폴백.
  const canChart = chartData.length > 0 && chartData.some((d) => d.value !== 0);

  // 표에 소수 셀(1~4) 마스킹이 적용됐는지(규정 안내문 표시용).
  const anyMasked = useMemo(
    () => rows.some((r) => numericCols.some((ci) => maskSmallCell(r[ci]).masked)),
    [rows, numericCols]
  );

  const [view, setView] = useState<"chart" | "table">(chartKind === "table" ? "table" : "chart");
  const effectiveView = canChart ? view : "table";

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
                      {numericCols.includes(ci) ? maskSmallCell(r[ci]).text : r[ci]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {anyMasked && (
            <p className="px-2 py-1.5 text-[10px] text-slate-400">
              개인정보 보호를 위해 1~4명 소수 셀은 ‘&lt;5’로 마스킹했습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
