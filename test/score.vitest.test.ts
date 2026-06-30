// lib/data/score.ts 기회점수 계산 테스트 (vitest).
// score.ts 는 확장자 없는 상대 import(./normalize)를 써서 node:test 로는 해석 불가 →
// vite resolver 를 쓰는 vitest 로 커버한다. (실행: npm run test:unit)
// ※ 단언값은 tsc CommonJS 컴파일 산출물로 실검증됨(overallOpportunityScore=29).
import { describe, it, expect } from "vitest";
import { calculateOpportunityScore, calculateRegionScores, type RegionScoreSource } from "@/lib/data/score";

describe("calculateOpportunityScore", () => {
  it("가중 합성이 결정적 — foreignResidentCount=100, 나머지 0 → overall=29", () => {
    const r = calculateOpportunityScore({
      foreignResidentCount: 100,
      workerSegmentCount: 0,
      studentSegmentCount: 0,
      universityForeignStudentCount: 0,
      nationalityConcentration: 0,
      nationalityDiversity: 0,
      newArrivalGrowthRate: 0
    });
    expect(r.foreignPopulationScore).toBe(100);
    expect(r.multilingualCsScore).toBe(40); // 0.4*100
    expect(r.overallOpportunityScore).toBe(29); // 0.25*100 + 0.1*40
  });
});

describe("calculateRegionScores", () => {
  it("입력 행수만큼 점수행 반환 + 메타 유지", () => {
    const rows: RegionScoreSource[] = [
      {
        id: "a", baseMonth: "2025-12-01", sido: "경기", sigungu: "안산",
        topNationality: "베트남", dominantSegment: "비전문취업 근로자",
        residentCount: 100, yoyChangeRate: 5, workerSegmentCount: 50,
        studentSegmentCount: 10, universityForeignStudentCount: 5,
        nationalityConcentration: 0.4, nationalityDiversity: 0.6, newArrivalGrowthRate: 7
      },
      {
        id: "b", baseMonth: "2025-12-01", sido: "서울", sigungu: "구로",
        topNationality: "중국", dominantSegment: "재외동포",
        residentCount: 200, yoyChangeRate: 3, workerSegmentCount: 30,
        studentSegmentCount: 40, universityForeignStudentCount: 20,
        nationalityConcentration: 0.5, nationalityDiversity: 0.7, newArrivalGrowthRate: 4
      }
    ];
    const out = calculateRegionScores(rows);
    expect(out).toHaveLength(2);
    expect(out[0].sido).toBe("경기");
    expect(typeof out[0].overallOpportunityScore).toBe("number");
  });
});
