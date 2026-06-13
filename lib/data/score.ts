import type {
  ForeignResidentSegment,
  RegionFinanceScore
} from "@/lib/types/foreignResident";
import { normalizeCollection } from "./normalize";

export type ScoreInput = {
  foreignResidentCount: number;
  workerSegmentCount: number;
  studentSegmentCount: number;
  universityForeignStudentCount: number;
  nationalityConcentration: number;
  nationalityDiversity: number;
  newArrivalGrowthRate: number;
  existingRemittanceCount?: number;
  existingPayrollAccountCount?: number;
};

export type RegionScoreSource = {
  id: string;
  baseMonth: string;
  sido: string;
  sigungu: string;
  topNationality: string;
  dominantSegment: ForeignResidentSegment;
  residentCount: number;
  yoyChangeRate: number;
  workerSegmentCount: number;
  studentSegmentCount: number;
  universityForeignStudentCount: number;
  nationalityConcentration: number;
  nationalityDiversity: number;
  newArrivalGrowthRate: number;
  existingRemittanceCount?: number;
  existingPayrollAccountCount?: number;
};

export type CalculatedRegionScore = RegionFinanceScore & {
  residentCount: number;
  yoyChangeRate: number;
  topNationality: string;
  dominantSegment: ForeignResidentSegment;
};

export function calculateOpportunityScore(input: ScoreInput) {
  const foreignPopulationScore = input.foreignResidentCount;

  const remittanceNeedScore =
    0.5 * input.workerSegmentCount +
    0.3 * input.nationalityConcentration +
    0.2 * (input.existingRemittanceCount ?? input.workerSegmentCount);

  const studentFinanceScore =
    0.5 * input.studentSegmentCount +
    0.3 * input.universityForeignStudentCount +
    0.2 * input.nationalityDiversity;

  const payrollNeedScore =
    0.8 * input.workerSegmentCount +
    0.2 * (input.existingPayrollAccountCount ?? input.workerSegmentCount);

  const multilingualCsScore =
    0.4 * input.foreignResidentCount +
    0.3 * input.nationalityDiversity +
    0.3 * input.newArrivalGrowthRate;

  const overallOpportunityScore =
    0.25 * foreignPopulationScore +
    0.25 * remittanceNeedScore +
    0.2 * studentFinanceScore +
    0.2 * payrollNeedScore +
    0.1 * multilingualCsScore;

  return {
    foreignPopulationScore,
    remittanceNeedScore,
    studentFinanceScore,
    payrollNeedScore,
    multilingualCsScore,
    overallOpportunityScore
  };
}

export function calculateRegionScores(
  rows: RegionScoreSource[]
): CalculatedRegionScore[] {
  const normalizedResident = normalizeCollection(rows, (row) => row.residentCount);
  const normalizedWorker = normalizeCollection(rows, (row) => row.workerSegmentCount);
  const normalizedStudent = normalizeCollection(rows, (row) => row.studentSegmentCount);
  const normalizedUniversity = normalizeCollection(
    rows,
    (row) => row.universityForeignStudentCount
  );
  const normalizedConcentration = normalizeCollection(
    rows,
    (row) => row.nationalityConcentration
  );
  const normalizedDiversity = normalizeCollection(rows, (row) => row.nationalityDiversity);
  const normalizedGrowth = normalizeCollection(rows, (row) => row.newArrivalGrowthRate);
  const normalizedRemittance = normalizeCollection(
    rows,
    (row) => row.existingRemittanceCount ?? row.workerSegmentCount
  );
  const normalizedPayroll = normalizeCollection(
    rows,
    (row) => row.existingPayrollAccountCount ?? row.workerSegmentCount
  );

  return rows.map((row) => ({
    id: row.id,
    baseMonth: row.baseMonth,
    sido: row.sido,
    sigungu: row.sigungu,
    nationality: row.topNationality,
    segmentType: row.dominantSegment,
    residentCount: row.residentCount,
    yoyChangeRate: row.yoyChangeRate,
    topNationality: row.topNationality,
    dominantSegment: row.dominantSegment,
    ...calculateOpportunityScore({
      foreignResidentCount: normalizedResident.get(row) ?? 0,
      workerSegmentCount: normalizedWorker.get(row) ?? 0,
      studentSegmentCount: normalizedStudent.get(row) ?? 0,
      universityForeignStudentCount: normalizedUniversity.get(row) ?? 0,
      nationalityConcentration: normalizedConcentration.get(row) ?? 0,
      nationalityDiversity: normalizedDiversity.get(row) ?? 0,
      newArrivalGrowthRate: normalizedGrowth.get(row) ?? 0,
      existingRemittanceCount: normalizedRemittance.get(row) ?? 0,
      existingPayrollAccountCount: normalizedPayroll.get(row) ?? 0
    })
  }));
}
