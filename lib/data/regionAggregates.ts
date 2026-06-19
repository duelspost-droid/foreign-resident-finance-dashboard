// 시도별 외국인주민 집계 — 실데이터(KOSIS 행정안전부 시도별 외국인주민 현황)에서 파생.
//
// realApiRegionData 는 여러 KOSIS 소스(행안부 외국인주민·법무부 시군구 등록외국인·KEDI 유학생)가
// 한 배열로 합쳐져 있고, 표의 ITM(외국인주민수·내국인·총인구·비율 등) 차원이 한 필드(residentCount)로
// 평탄화돼 있다. 따라서 단순 합산은 이중계산이 된다.
//
// 행안부 소스의 "시도별 첫 행"이 곧 외국인주민 총수(계) ITM 이라는 점을 이용해(첫 출현만 사용),
// 시도별 외국인주민 총수를 안전하게 복원한다. 또한 합산 총수가 상식 범위(100만~600만)일 때만
// 실데이터로 신뢰하고, 아니면 빈 값으로 폴백해 잘못된 지도 표기를 막는다.

import { realApiRegionData } from "./generated/realData";

const SIDO_NAMES = new Set([
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도",
  "경상남도", "제주특별자치도"
]);

// 한 기준월의 시도별 외국인주민 총수(시도별 첫 행 = 외국인주민수 ITM)를 집계.
function statsForMonth(rows: typeof realApiRegionData, month: string): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const r of rows) {
    if (r.baseMonth !== month) continue;
    if (!SIDO_NAMES.has(r.sido)) continue; // 17개 시도만(합계·시군구 행 제외)
    if (r.sido in stats) continue; // 시도별 첫 행 = 외국인주민 총수(계) ITM 만 사용
    stats[r.sido] = r.residentCount;
  }
  return stats;
}

function build() {
  // 행안부 외국인주민 시도별 소스만 사용(법무부 시군구·KEDI 유학생 등 다른 혼합 소스 제외).
  const rows = realApiRegionData.filter((r) => (r.sourceName ?? "").includes("행정안전부 외국인주민"));
  if (rows.length === 0) {
    return { latestMonth: null as string | null, stats: {} as Record<string, number>, total: 0, trend: [] as { year: number; total: number }[] };
  }

  const months = [...new Set(rows.map((r) => r.baseMonth))].sort();
  const latestMonth = months.at(-1) ?? null;
  const stats = latestMonth ? statsForMonth(rows, latestMonth) : {};
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  // 연도별 전국 합계 추이(정합성 범위 밖 연도는 제외).
  const trend = months
    .map((mo) => ({ year: Number(mo.slice(0, 4)), total: Object.values(statsForMonth(rows, mo)).reduce((a, b) => a + b, 0) }))
    .filter((p) => p.total >= 1_000_000 && p.total <= 6_000_000);

  return { latestMonth, stats, total, trend };
}

const agg = build();

// 정합성 가드: 외국인주민 총수가 상식 범위이고 시도 15개 이상일 때만 실데이터로 채택.
const SANE = agg.total >= 1_000_000 && agg.total <= 6_000_000 && Object.keys(agg.stats).length >= 15;

export const hasSidoForeignerStats = SANE;
export const sidoForeignerStats: Record<string, number> = SANE ? agg.stats : {};
export const sidoForeignerTotal = SANE ? agg.total : 0;
export const sidoForeignerLatestYear =
  SANE && agg.latestMonth ? Number(agg.latestMonth.slice(0, 4)) : null;

// 연도별 전국 외국인주민 추이(행안부). 화면에서 최근 N년 추이로 사용.
export type SidoForeignerTrendPoint = { year: number; total: number };
export const sidoForeignerTrend: SidoForeignerTrendPoint[] = agg.trend;
export const hasSidoForeignerTrend = sidoForeignerTrend.length >= 3;
