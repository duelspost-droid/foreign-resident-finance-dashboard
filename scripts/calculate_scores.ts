import { sampleOpportunityRows } from "@/lib/data/mockData";

export function calculateSampleScoresForBatch() {
  return sampleOpportunityRows.map((row) => ({
    base_month: row.baseMonth,
    sido: row.sido,
    sigungu: row.sigungu,
    nationality: row.topNationality,
    segment_type: row.dominantSegment,
    foreign_population_score: row.foreignPopulationScore,
    remittance_need_score: row.remittanceNeedScore,
    student_finance_score: row.studentFinanceScore,
    payroll_need_score: row.payrollNeedScore,
    multilingual_cs_score: row.multilingualCsScore,
    overall_opportunity_score: row.overallOpportunityScore
  }));
}
