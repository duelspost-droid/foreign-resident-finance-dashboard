// 금융 인사이트 페이지용 파생 데이터.
// 모든 값은 realData.ts + mockData.ts에서 계산한다.
// realData.ts는 CI 배치(매일 01:00 KST)가 새 데이터를 수집할 때마다 자동 재생성된다.
// 따라서 이 파일에서 파생된 값도 배치 완료 시 자동 갱신된다.

import {
  realBopTransferIncome,
  realDataSummary,
  realRegionData,
  realStudentSummary
} from "./generated/realData";
import {
  kpiSummary,
  nationalityDistributionData,
  sampleResidentStatus,
  stayVisaTypes
} from "./mockData";
import { realAvgOpportunityScore, realSidoOpportunity } from "./opportunityReal";

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
  // 실 전년 데이터가 없어 총·등록 외국인 YoY는 표기하지 않는다(가짜 수치 제거).
  totalForeignResidentsYoy: null as string | null,
  registeredForeignResidents: kpiSummary.registeredResidents > 0 ? kpiSummary.registeredResidents : 1_277_945,
  foreignStudents: kpiSummary.foreignStudents > 0 ? kpiSummary.foreignStudents : 185_010,
  // 유학생 YoY는 실데이터(realStudentSummary.yoy) 단일 출처를 사용한다.
  foreignStudentsYoy: realStudentSummary.hasData ? `+${realStudentSummary.yoy}%` : (null as string | null),
  averageOpportunityScore: realAvgOpportunityScore ?? Math.round(kpiSummary.averageOpportunityScore),
  // 송금 KRW 추정치(하드코딩)를 폐기하고 한국은행 이전소득수지 실측값(억달러 환산)을 대리지표로 노출.
  remittanceProxy:
    realBopTransferIncome.latestValue != null
      ? `약 ${Math.round(realBopTransferIncome.latestValue / 100).toLocaleString()}억달러`
      : "집계 대기",
  remittanceProxyYear: realBopTransferIncome.latestYear,
  e9WorkerEstimate: e9Count > 0 ? `${(e9Count / 10000).toFixed(0)}만명` : "약 30만명",
  sourceLabel: kpiSummary.totalResidents > 0 ? "법무부 국적별 현황 2024" : "법무부 공식통계",
  collectedRowCount: realDataSummary.statusRowCount
} as const;

// ── 지역별 금융 전략 (실데이터: 행안부 시도별 외국인주민 + KEDI 유학생 + 증가율 가중 기회점수) ──
// 표본 6개 시군구가 아니라 17개 시도 실집계 상위 5개. CI 배치 갱신 시 자동 변경.
function strategyFocus(r: (typeof realSidoOpportunity)[number]): string {
  if (r.studentScore >= r.sizeScore && r.studentScore >= r.growthScore)
    return "유학생 밀집 — 캠퍼스 계좌·등록금 송금";
  if (r.growthScore >= r.sizeScore)
    return "고성장 권역 — 선제 진입·다국어 인프라";
  return "대규모 외국인 권역 — 지점·ATM·급여계좌";
}

export const regionStrategy = realSidoOpportunity.slice(0, 5).map((r) => ({
  rank: r.rank,
  sido: r.sido,
  residentCount: r.residentCount,
  studentCount: r.studentCount,
  yoy: r.yoy,
  score: r.overallScore,
  focus: strategyFocus(r)
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
