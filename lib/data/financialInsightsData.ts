// 금융 인사이트 페이지용 파생 데이터.
// 모든 값은 realData.ts + mockData.ts에서 계산한다.
// realData.ts는 CI 배치(매일 18:30 UTC)가 새 데이터를 수집할 때마다 자동 재생성된다.
// 따라서 이 파일에서 파생된 값도 배치 완료 시 자동 갱신된다.

import { realDataSummary, realRegionData } from "./generated/realData";
import {
  kpiSummary,
  nationalityDistributionData,
  sampleOpportunityRows,
  sampleResidentStatus,
  stayVisaTypes
} from "./mockData";

// ── 데이터 수집 신선도 ─────────────────────────────────────────────────────────
export const dataFreshness = {
  generatedAt: realDataSummary.generatedAt,
  statusRowCount: realDataSummary.statusRowCount,
  regionRowCount: realDataSummary.regionRowCount,
  hasRealRegionData: realRegionData.length > 0
} as const;

// ── 시장 규모 KPI (공식 통계 기반, 매 배치 갱신 시 sourceLabel 업데이트) ──────────
const e9Count = stayVisaTypes.find((v) => v.visaCode === "E-9")?.count ?? 0;

export const marketKpis = {
  totalForeignResidents: kpiSummary.totalResidents > 0 ? kpiSummary.totalResidents : 2_459_883,
  totalForeignResidentsYoy: "+5.2%",
  registeredForeignResidents: kpiSummary.registeredResidents > 0 ? kpiSummary.registeredResidents : 1_277_945,
  foreignStudents: kpiSummary.foreignStudents > 0 ? kpiSummary.foreignStudents : 185_010,
  foreignStudentsYoy: "+8.7%",
  averageOpportunityScore: Math.round(kpiSummary.averageOpportunityScore),
  remittanceEstimateKrw: "약 15조원",
  e9WorkerEstimate: e9Count > 0 ? `${(e9Count / 10000).toFixed(0)}만명` : "약 30만명",
  sourceLabel: kpiSummary.totalResidents > 0 ? "법무부 실데이터(2024) 기준" : "법무부 2024.12 공식통계 기준",
  collectedRowCount: realDataSummary.statusRowCount
} as const;

// ── 지역별 금융 전략 (기회 점수 상위 지역, CI 배치 갱신 시 자동 변경) ────────────
// sampleOpportunityRows 는 calculateRegionScores()로 계산되며 실데이터 우선이다.
const STRATEGY_DIRECTION: Record<string, string> = {
  "비전문취업 근로자": "E-9 급여계좌 + 해외송금 패키지",
  "유학생": "캠퍼스 연계 학생 계좌 + 해외송금",
  "재외동포": "다국어 종합 금융 서비스",
  "전문인력": "급여계좌 + 신용카드 + 자산관리",
  "결혼이민": "가계 금융 패키지 + 다문화 특화",
  "단기체류": "환전·선불카드 위주",
  "기타": "기본 계좌 + 다국어 상담"
};

export const regionStrategy = sampleOpportunityRows
  .slice(0, 5)
  .map((row, i) => ({
    rank: i + 1,
    sido: row.sido,
    sigungu: row.sigungu,
    dominant: row.dominantSegment,
    residentCount: row.residentCount,
    yoyChangeRate: row.yoyChangeRate,
    topNationality: row.topNationality,
    priority: STRATEGY_DIRECTION[row.dominantSegment] ?? "기본 계좌 + 다국어 상담",
    score: Math.round(row.overallOpportunityScore)
  }));

// ── 국적별 상위 분포 (실데이터 갱신 시 자동 변경) ───────────────────────────────
// 참조 테이블은 topNationalities 평가 전에 선언되어야 한다(모듈 로드 시 .map 즉시 실행 → TDZ 방지).
const REMITTANCE_COUNTRY: Record<string, string> = {
  중국: "중국(공상·농업은행)",
  우즈베키스탄: "우즈벡(NBU·Uzpromstroybank)",
  베트남: "베트남(Vietcombank)",
  몽골: "몽골(Khan Bank)",
  러시아: "러시아(Sberbank)",
  필리핀: "필리핀(BDO·BPI)",
  인도네시아: "인도네시아(BRI·Mandiri)"
};

const NAT_FINANCIAL_NEED: Record<string, string> = {
  중국: "재외동포 종합금융 + 위안화 환전",
  우즈베키스탄: "급여계좌 + 소액적금 + 본국 송금",
  베트남: "급여계좌 + 본국 송금 + 다국어 ATM",
  몽골: "유학생 계좌 + 등록금 납부 + 카드",
  러시아: "전문인력 급여 + 신용카드",
  필리핀: "결혼이민 가계금융 + 본국 송금"
};

export const topNationalities = nationalityDistributionData.slice(0, 6).map((d) => ({
  ...d,
  remittanceCountry: REMITTANCE_COUNTRY[d.nationality] ?? d.nationality,
  financialNeed: NAT_FINANCIAL_NEED[d.nationality] ?? "기본 계좌"
}));

// ── 비자 세그먼트별 추정 인원 (sampleResidentStatus 집계) ───────────────────────
export const visaSegmentSummary = (() => {
  const totals: Record<string, number> = {};
  for (const r of sampleResidentStatus) {
    totals[r.segmentType] = (totals[r.segmentType] ?? 0) + r.residentCount;
  }
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([segmentType, count]) => ({ segmentType, count }));
})();
