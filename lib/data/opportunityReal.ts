// 시도별 "실데이터 기회 점수" — 투명한 가중 모델.
// 입력(모두 실데이터): 외국인주민 규모(행안부) + 유학생 규모(KEDI) + 전년 대비 증가율(행안부).
// 표본 6개 시군구(sampleOpportunityRows)와 달리 17개 시도 전부를 실측으로 산출한다.
// 가중치는 명시적이며(규모 50 · 유학생 30 · 성장 20), 화면에 함께 노출한다.
// bopMarketEst: 한국은행 ECOS 이전소득수지(301Y013) 전국값 × 시도 거주 비중 → 시도별 송금시장 추정.

import {
  hasSidoForeignerStats,
  sidoForeignerStats,
  sidoForeignerTotal,
  sidoForeignerYoY
} from "./regionAggregates";
import { realBopTransferIncome, realKediStudentRegion } from "./generated/realData";

export type RealSidoOpportunity = {
  rank: number;
  sido: string;
  residentCount: number;
  studentCount: number;
  yoy: number | null;
  sizeScore: number;    // 외국인주민 규모 (0~100)
  studentScore: number; // 유학생 규모 (0~100)
  growthScore: number;  // 증가율 (0~100)
  overallScore: number; // 가중 합성 (0~100)
  bopMarketEst: number; // ECOS BOP 이전소득수지 시도 배분 추정 (백만달러)
};

export const OPPORTUNITY_WEIGHTS = { size: 50, student: 30, growth: 20 };

// 최신 연간 BOP(이전소득수지) — ECOS 301Y013
const bopAnnualSorted = [...realBopTransferIncome.annual].sort((a, b) => a.year - b.year);
const bopLatestValue = bopAnnualSorted.length ? bopAnnualSorted[bopAnnualSorted.length - 1].value : 0;
export const bopNationalLatest = bopLatestValue;  // 백만달러, 전국 합계

function build(): RealSidoOpportunity[] {
  if (!hasSidoForeignerStats) return [];

  const studentByRegion: Record<string, number> = {};
  for (const r of realKediStudentRegion.byRegion ?? []) studentByRegion[r.region] = r.value;

  const sidos = Object.keys(sidoForeignerStats);
  const maxResident = Math.max(...sidos.map((s) => sidoForeignerStats[s]), 1);
  const maxStudent = Math.max(...sidos.map((s) => studentByRegion[s] ?? 0), 1);
  const totalResidents = sidoForeignerTotal > 0 ? sidoForeignerTotal : maxResident;

  const norm = (v: number, max: number) => Math.round((v / max) * 100);
  // 증가율 정규화: [-5%, +15%] 구간을 [0,100]으로 매핑(범위 밖은 clamp, 데이터 없으면 중립 50).
  const growthNorm = (y: number | null) =>
    y == null ? 50 : Math.max(0, Math.min(100, Math.round(((y + 5) / 20) * 100)));

  const rows: RealSidoOpportunity[] = sidos.map((sido) => {
    const residentCount = sidoForeignerStats[sido];
    const studentCount = studentByRegion[sido] ?? 0;
    const yoy = sido in sidoForeignerYoY ? sidoForeignerYoY[sido] : null;
    const sizeScore = norm(residentCount, maxResident);
    const studentScore = norm(studentCount, maxStudent);
    const growthScore = growthNorm(yoy);
    const overallScore = Math.round(
      (sizeScore * OPPORTUNITY_WEIGHTS.size +
        studentScore * OPPORTUNITY_WEIGHTS.student +
        growthScore * OPPORTUNITY_WEIGHTS.growth) /
        100
    );
    // 시도별 BOP 배분: 전국 이전소득수지 × (시도 거주비중). 단위 백만달러, 소수점 1자리.
    const bopMarketEst = bopLatestValue > 0
      ? Math.round((residentCount / totalResidents) * bopLatestValue * 10) / 10
      : 0;
    return { rank: 0, sido, residentCount, studentCount, yoy, sizeScore, studentScore, growthScore, overallScore, bopMarketEst };
  });

  rows.sort((a, b) => b.overallScore - a.overallScore);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export const realSidoOpportunity = build();
export const hasRealSidoOpportunity = realSidoOpportunity.length >= 10;
