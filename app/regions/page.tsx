import { BarChart2, Globe, MapPin, Users } from "lucide-react";

import { RegionMap } from "@/components/charts/RegionMap";
import { SigunguBarChart } from "@/components/charts/SigunguBarChart";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";
import {
  hasSidoForeignerStats,
  hasSidoForeignerTrend,
  hasRealSigunguResidents,
  realSigunguResidents,
  sidoForeignerLatestYear,
  sidoForeignerStats,
  sidoForeignerTotal,
  sidoForeignerTrend
} from "@/lib/data/regionAggregates";
import { formatNumber } from "@/lib/utils/format";

export default function RegionsPage() {
  // 시도별 거주 통계 — sidoForeignerStats에서 직접 계산
  const sidoEntries = Object.entries(sidoForeignerStats).sort((a, b) => b[1] - a[1]);
  const topSidoName = sidoEntries[0]?.[0] ?? "—";
  const topSidoCount = sidoEntries[0]?.[1] ?? 0;
  const sidoCount = sidoEntries.length;

  // 전국 외국인주민 연도별 추이(행안부 실데이터)
  const trend = sidoForeignerTrend;
  const trendMax = Math.max(...trend.map((p) => p.total), 1);
  const trendLatest = trend.at(-1);
  const trendPrev = trend.at(-2);
  const trendYoy =
    trendLatest && trendPrev && trendPrev.total
      ? ((trendLatest.total - trendPrev.total) / trendPrev.total) * 100
      : null;

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="지역 분석"
        title="외국인이 어디에 얼마나 사는가"
        description="시도·시군구 단위 지리적 분포 현황입니다. 외국인주민 밀집도, 연도별 추이, 시군구별 집계를 확인하세요. 우선 공략 지역 랭킹은 사이드바 → 기회 점수에서 확인하세요."
      />

      {/* 실데이터 시도 분포 요약(있을 때) */}
      {hasSidoForeignerStats && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs leading-5 text-teal-800">
          <span className="rounded bg-teal-200 px-1.5 py-0.5 font-bold">실데이터</span>
          <span>
            지도는 <strong>행안부 시도별 외국인주민 현황{sidoForeignerLatestYear ? ` ${sidoForeignerLatestYear}` : ""}</strong>
            (전국 {formatNumber(sidoForeignerTotal)}명) 실집계로 표시됩니다.
          </span>
        </div>
      )}


      <div className="stat-grid">
        <StatTile
          label="전국 외국인주민"
          value={sidoCount > 0 ? formatNumber(sidoForeignerTotal) : "—"}
          unit={sidoCount > 0 ? "명" : ""}
          icon={<Users size={18} />}
          accent="#0f766e"
          sub={sidoCount > 0
            ? `행안부 시도별 집계${sidoForeignerLatestYear ? ` ${sidoForeignerLatestYear}년` : ""}`
            : "실데이터 수집 전"}
        />
        <StatTile
          label="가장 많은 시도"
          value={sidoCount > 0 ? topSidoName : "—"}
          icon={<Globe size={18} />}
          accent="#b45309"
          trend={sidoCount > 0 ? { label: "외국인주민 최다", dir: "up" } : undefined}
          sub={sidoCount > 0 ? `${formatNumber(topSidoCount)}명 거주` : "실데이터 수집 전"}
        />
        <StatTile
          label="분석 시도 수"
          value={sidoCount > 0 ? sidoCount : "—"}
          unit={sidoCount > 0 ? "개 시도" : ""}
          icon={<MapPin size={18} />}
          accent="#3157a4"
          sub="행안부 시도별 외국인주민 현황"
        />
        <StatTile
          label="집계 시군구 수"
          value={hasRealSigunguResidents ? realSigunguResidents.length : "—"}
          unit={hasRealSigunguResidents ? "개" : ""}
          icon={<BarChart2 size={18} />}
          accent="#be123c"
          sub={hasRealSigunguResidents ? "KOSIS 법무부 시군구별 등록외국인" : "실데이터 수집 전"}
        />
      </div>

      {/* 전국 외국인주민 연도별 추이 (행안부 실데이터) */}
      {hasSidoForeignerTrend && trendLatest && (
        <Panel
          title="전국 외국인주민 연도별 추이"
          subtitle={`행안부 시도별 외국인주민 합계 · ${trend[0].year}~${trendLatest.year}`}
          right={
            trendYoy != null ? (
              <span className="eyebrow">전년 대비 {trendYoy >= 0 ? "+" : ""}{trendYoy.toFixed(1)}%</span>
            ) : undefined
          }
          bodyClassName="p-5 pt-4"
        >
          <div className="flex items-end gap-2 overflow-x-auto" style={{ height: 200 }}>
            {trend.map((p) => {
              const h = Math.max(4, Math.round((p.total / trendMax) * 150));
              const isLast = p.year === trendLatest.year;
              return (
                <div
                  key={p.year}
                  className="flex min-w-[30px] flex-1 flex-col items-center gap-1"
                  role="img"
                  aria-label={`${p.year}년 외국인주민 ${p.total.toLocaleString()}명`}
                >
                  <span className="text-[10px] font-semibold text-slate-500">{(p.total / 10000).toFixed(0)}만</span>
                  <div className="flex w-full max-w-[40px] items-end" style={{ height: 150 }}>
                    <div
                      className="w-full rounded-t"
                      style={{ height: h, background: isLast ? "#0f766e" : "#94a3b8" }}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{String(p.year).slice(2)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            행정안전부 「지방자치단체 외국인주민 현황」(매년 11/1 기준) 시도 합계. 2020~21년은 코로나로 일시 감소 후 회복했습니다.
          </p>
        </Panel>
      )}

      {hasRealSigunguResidents && (
        <Panel
          title="시군구별 등록외국인 TOP 20 (실데이터)"
          subtitle={`KOSIS 법무부 시군구별·체류자격별 등록외국인 현황 · ${realSigunguResidents.length}개 시군구 · 합계 기준`}
          bodyClassName="p-0"
        >
          <div style={{ height: 560 }} className="px-2 py-3">
            <SigunguBarChart />
          </div>
        </Panel>
      )}

      <Panel
        title={hasSidoForeignerStats ? "대한민국 시도별 외국인주민 지도" : "대한민국 지역 기회 지도"}
        subtitle={
          hasSidoForeignerStats
            ? "버블 크기·색상 = 시도별 외국인주민 규모 (행안부 실데이터)"
            : "버블 크기는 외국인 수, 색상은 시도 평균 기회 점수"
        }
        bodyClassName="p-3 pt-2"
      >
        <div className="h-[460px]">
          <RegionMap />
        </div>
      </Panel>

    </div>
  );
}
