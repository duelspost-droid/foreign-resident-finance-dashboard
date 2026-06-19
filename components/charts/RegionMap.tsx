"use client";

import { useState } from "react";
import { sampleOpportunityRows } from "@/lib/data/mockData";
import {
  hasSidoForeignerStats,
  sidoForeignerLatestYear,
  sidoForeignerStats
} from "@/lib/data/regionAggregates";
import { scoreColor } from "@/lib/utils/format";

const SIDO_CENTROIDS = [
  { code: "11", name: "서울특별시", lon: 126.977, lat: 37.566 },
  { code: "26", name: "부산광역시", lon: 129.075, lat: 35.180 },
  { code: "27", name: "대구광역시", lon: 128.601, lat: 35.872 },
  { code: "28", name: "인천광역시", lon: 126.705, lat: 37.456 },
  { code: "29", name: "광주광역시", lon: 126.851, lat: 35.160 },
  { code: "30", name: "대전광역시", lon: 127.385, lat: 36.351 },
  { code: "31", name: "울산광역시", lon: 129.311, lat: 35.538 },
  { code: "36", name: "세종특별자치시", lon: 127.289, lat: 36.480 },
  { code: "41", name: "경기도", lon: 127.190, lat: 37.491 },
  { code: "42", name: "강원특별자치도", lon: 128.155, lat: 37.882 },
  { code: "43", name: "충청북도", lon: 127.729, lat: 36.629 },
  { code: "44", name: "충청남도", lon: 126.673, lat: 36.547 },
  { code: "45", name: "전북특별자치도", lon: 127.108, lat: 35.820 },
  { code: "46", name: "전라남도", lon: 126.991, lat: 34.816 },
  { code: "47", name: "경상북도", lon: 128.889, lat: 36.575 },
  { code: "48", name: "경상남도", lon: 128.692, lat: 35.238 },
  { code: "50", name: "제주특별자치도", lon: 126.543, lat: 33.500 },
];

const W = 500;
const H = 600;
const PAD = 30;
const MIN_LON = 124.5;
const MAX_LON = 130.5;
const MIN_LAT = 33.0;
const MAX_LAT = 38.6;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (W - 2 * PAD) + PAD;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (H - 2 * PAD) + PAD;
  return [x, y];
}

// 인구 규모(실데이터 모드) 색상 — 최댓값 대비 비율 구간.
function populationColor(count: number, max: number): string {
  if (count <= 0) return "#cbd5e1";
  const f = count / max;
  if (f >= 0.5) return "#0f766e"; // 매우 많음
  if (f >= 0.25) return "#3157a4"; // 많음
  if (f >= 0.1) return "#b45309"; // 보통
  return "#64748b"; // 적음
}

const LABEL_ABBR: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

type Tooltip = {
  name: string;
  score: number;
  count: number;
  cx: number;
  cy: number;
  r: number;
};

export function RegionMap() {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  // 실데이터(행안부 시도별 외국인주민)가 있으면 인구 규모 지도, 없으면 표본 기회점수 지도.
  const realMode = hasSidoForeignerStats;

  const sidoStats = SIDO_CENTROIDS.map((sido) => {
    if (realMode) {
      const count = sidoForeignerStats[sido.name] ?? 0;
      return { ...sido, score: 0, count, hasData: count > 0 };
    }
    const rows = sampleOpportunityRows.filter((r) => r.sido === sido.name);
    const score =
      rows.length > 0
        ? rows.reduce((s, r) => s + r.overallOpportunityScore, 0) / rows.length
        : 0;
    const count = rows.reduce((s, r) => s + r.residentCount, 0);
    return { ...sido, score, count, hasData: rows.length > 0 };
  });

  const maxCount = Math.max(...sidoStats.map((s) => s.count), 1);

  // realMode=true: 색상=인구 규모 비율(populationColor). realMode=false: 색상=표본 기회점수(scoreColor 0~100).
  const fillFor = (s: { hasData: boolean; score: number; count: number }) => {
    if (!s.hasData) return "#94a3b8";
    return realMode ? populationColor(s.count, maxCount) : scoreColor(s.score);
  };

  const ariaFor = (s: { name: string; score: number; count: number; hasData: boolean }) =>
    realMode
      ? `${s.name}. 외국인주민 ${s.count.toLocaleString()}명`
      : `${s.name}. 기회 점수 ${s.score > 0 ? s.score.toFixed(1) : "데이터없음"}, 외국인 ${s.count.toLocaleString()}명`;

  // 범례 스와치는 실제 색상 함수와 동일한 hex 사용(버블과 일치).
  const legend = realMode
    ? [
        { c: "#0f766e", label: "매우 많음" },
        { c: "#3157a4", label: "많음" },
        { c: "#b45309", label: "보통" },
        { c: "#64748b", label: "적음" },
        { c: "#cbd5e1", label: "데이터 없음" },
      ]
    : [
        { c: "#0f766e", label: "72+ (최우선)" },
        { c: "#3157a4", label: "55~71 (우선)" },
        { c: "#b45309", label: "40~54 (관찰)" },
        { c: "#be123c", label: "~39 (후순위)" },
        { c: "#94a3b8", label: "데이터 없음" },
      ];

  return (
    <div className="flex flex-col">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-h-[460px]"
        role="group"
        aria-label={
          realMode
            ? "대한민국 시도별 외국인주민 인구 규모 지도"
            : "대한민국 시도별 외국인 금융 기회 표본 지도"
        }
      >
        {/* Mainland outline */}
        <path
          d="M 155 97 L 177 127 L 199 165 L 147 213 L 177 261 L 191 290 L 169 397 L 250 415 L 265 406 L 331 397 L 368 367 L 390 319 L 390 281 L 390 175 L 375 107 L 382 49 L 338 40 L 228 88 Z"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Jeju island */}
        <ellipse
          cx="180"
          cy="522"
          rx="32"
          ry="18"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {sidoStats.map((sido) => {
          const [cx, cy] = project(sido.lon, sido.lat);
          const r = sido.count > 0 ? 8 + (sido.count / maxCount) * 22 : 8;
          const color = fillFor(sido);
          const label = LABEL_ABBR[sido.name] ?? sido.name;
          const show = () =>
            setTooltip({ name: sido.name, score: sido.score, count: sido.count, cx, cy, r });

          return (
            <g key={sido.code}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                fillOpacity={tooltip?.name === sido.name ? 1 : 0.78}
                stroke="white"
                strokeWidth={tooltip?.name === sido.name ? 2.5 : 1.5}
                className="cursor-pointer focus:outline-none focus-visible:stroke-slate-900"
                tabIndex={0}
                role="img"
                aria-label={ariaFor(sido)}
                onMouseEnter={show}
                onMouseLeave={() => setTooltip(null)}
                onFocus={show}
                onBlur={() => setTooltip(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    show();
                  }
                }}
              />
              <text
                x={cx}
                y={cy + r + 11}
                textAnchor="middle"
                fontSize="9"
                fill="#475569"
                className="pointer-events-none select-none"
              >
                {label}
              </text>
            </g>
          );
        })}

        {tooltip && (() => {
          const tx = Math.min(tooltip.cx + tooltip.r + 8, W - 145);
          const ty = Math.max(tooltip.cy - 44, 4);
          return (
            <g className="pointer-events-none">
              <rect
                x={tx}
                y={ty}
                width="138"
                height="58"
                rx="5"
                fill="white"
                stroke="#e2e8f0"
                strokeWidth="1"
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,.12))" }}
              />
              <text x={tx + 8} y={ty + 16} fontSize="10.5" fontWeight="600" fill="#0f172a">
                {tooltip.name}
              </text>
              <text x={tx + 8} y={ty + 32} fontSize="9.5" fill="#475569">
                {realMode
                  ? tooltip.count > 0
                    ? `외국인주민 ${tooltip.count.toLocaleString()}명`
                    : "집계 없음"
                  : tooltip.score > 0
                    ? `기회 점수 ${tooltip.score.toFixed(1)}`
                    : "데이터 없음"}
              </text>
              <text x={tx + 8} y={ty + 48} fontSize="9.5" fill="#475569">
                {realMode
                  ? "행안부 외국인주민"
                  : tooltip.count > 0
                    ? `외국인 ${tooltip.count.toLocaleString()}명`
                    : "집계 없음"}
              </text>
            </g>
          );
        })()}
      </svg>

      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 px-3 pb-2 text-xs text-slate-500">
        {legend.map(({ c, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
            {label}
          </span>
        ))}
        <span className="ml-auto text-slate-400">
          버블 크기 = 외국인 수
          {realMode && sidoForeignerLatestYear ? ` · 실데이터 ${sidoForeignerLatestYear}` : " · 표본"}
        </span>
      </div>
    </div>
  );
}
