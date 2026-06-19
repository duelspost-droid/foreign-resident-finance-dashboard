// 시도별 "실데이터 기회 점수" — 투명한 가중 모델.
// 입력(모두 실데이터): 외국인주민 규모(행안부) + 유학생 규모(KEDI) + 전년 대비 증가율(행안부).
// 표본 6개 시군구(sampleOpportunityRows)와 달리 17개 시도 전부를 실측으로 산출한다.
// 가중치는 명시적이며(규모 50 · 유학생 30 · 성장 20), 화면에 함께 노출한다.

import {
  hasSidoForeignerStats,
  sidoForeignerStats,
  sidoForeignerYoY
} from "./regionAggregates";
import { realKediStudentRegion } from "./generated/realData";

export type RealSidoOpportunity = {
  rank: number;
  sido: string;
  residentCount: number;
  studentCount: number;
  yoy: number | null;
  sizeScore: number; // 외국인주민 규모(0~100)
  studentScore: number; // 유학생 규모(0~100)
  growthScore: number; // 증가율(0~100)
  overallScore: number; // 가중 합성(0~100)
};

export const OPPORTUNITY_WEIGHTS = { size: 50, student: 30, growth: 20 };

function build(): RealSidoOpportunity[] {
  if (!hasSidoForeignerStats) return [];

  const studentByRegion: Record<string, number> = {};
  for (const r of realKediStudentRegion.byRegion ?? []) studentByRegion[r.region] = r.value;

  const sidos = Object.keys(sidoForeignerStats);
  const maxResident = Math.max(...sidos.map((s) => sidoForeignerStats[s]), 1);
  const maxStudent = Math.max(...sidos.map((s) => studentByRegion[s] ?? 0), 1);

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
    return { rank: 0, sido, residentCount, studentCount, yoy, sizeScore, studentScore, growthScore, overallScore };
  });

  rows.sort((a, b) => b.overallScore - a.overallScore);
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export const realSidoOpportunity = build();
export const hasRealSidoOpportunity = realSidoOpportunity.length >= 10;
