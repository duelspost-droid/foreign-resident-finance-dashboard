import type { FinanceSegmentAggregate } from "@/lib/types/finance";
import type {
  ForeignResidentRegionMonth,
  ForeignResidentSegment,
  ForeignResidentStatus,
  RegionOpportunityRow
} from "@/lib/types/foreignResident";
import type {
  ForeignStudentUniversity,
  UniversityOpportunity
} from "@/lib/types/university";
import {
  calculateRegionScores,
  type RegionScoreSource
} from "./score";
import {
  generateOpportunityAction,
  generateRegionInsight,
  generateUniversityCampaign
} from "./insights";
import {
  realDataSummary,
  realForeignResidentStatus,
  realRegionData
} from "./generated/realData";

const fallbackRegionData: ForeignResidentRegionMonth[] = [
  {
    id: "r1",
    baseMonth: "2025-12-01",
    sido: "서울특별시",
    sigungu: "구로구",
    nationality: "중국",
    gender: "전체",
    residentCount: 28500,
    longTermCount: 26000,
    shortTermCount: 2500,
    yoyChangeRate: 3.2,
    momChangeRate: 0.4,
    sourceName: "법무부 등록외국인 체류현황"
  },
  {
    id: "r2",
    baseMonth: "2025-12-01",
    sido: "경기도",
    sigungu: "안산시",
    nationality: "우즈베키스탄",
    gender: "전체",
    residentCount: 14200,
    longTermCount: 13200,
    shortTermCount: 1000,
    yoyChangeRate: 7.8,
    momChangeRate: 1.1,
    sourceName: "법무부 등록외국인 체류현황"
  },
  {
    id: "r3",
    baseMonth: "2025-12-01",
    sido: "충청남도",
    sigungu: "아산시",
    nationality: "베트남",
    gender: "전체",
    residentCount: 9800,
    longTermCount: 9100,
    shortTermCount: 700,
    yoyChangeRate: 9.4,
    momChangeRate: 1.6,
    sourceName: "법무부 등록외국인 체류현황"
  },
  {
    id: "r4",
    baseMonth: "2025-12-01",
    sido: "서울특별시",
    sigungu: "동대문구",
    nationality: "몽골",
    gender: "전체",
    residentCount: 7600,
    longTermCount: 6900,
    shortTermCount: 700,
    yoyChangeRate: 5.4,
    momChangeRate: 0.9,
    sourceName: "법무부 등록외국인 체류현황"
  },
  {
    id: "r5",
    baseMonth: "2025-12-01",
    sido: "부산광역시",
    sigungu: "금정구",
    nationality: "베트남",
    gender: "전체",
    residentCount: 6200,
    longTermCount: 5700,
    shortTermCount: 500,
    yoyChangeRate: 6.6,
    momChangeRate: 0.7,
    sourceName: "법무부 등록외국인 체류현황"
  },
  {
    id: "r6",
    baseMonth: "2025-12-01",
    sido: "인천광역시",
    sigungu: "연수구",
    nationality: "러시아",
    gender: "전체",
    residentCount: 5400,
    longTermCount: 5000,
    shortTermCount: 400,
    yoyChangeRate: 4.1,
    momChangeRate: 0.6,
    sourceName: "법무부 등록외국인 체류현황"
  },
  {
    id: "r7",
    baseMonth: "2025-12-01",
    sido: "대구광역시",
    sigungu: "달서구",
    nationality: "베트남",
    gender: "전체",
    residentCount: 4900,
    longTermCount: 4500,
    shortTermCount: 400,
    yoyChangeRate: 8.2,
    momChangeRate: 1.0,
    sourceName: "법무부 등록외국인 체류현황"
  },
  {
    id: "r8",
    baseMonth: "2025-12-01",
    sido: "경기도",
    sigungu: "수원시",
    nationality: "중국",
    gender: "전체",
    residentCount: 8700,
    longTermCount: 8050,
    shortTermCount: 650,
    yoyChangeRate: 4.9,
    momChangeRate: 0.5,
    sourceName: "법무부 등록외국인 체류현황"
  }
];

export const sampleRegionData: ForeignResidentRegionMonth[] =
  realDataSummary.regionRowCount > 0
    ? realRegionData.map((row) => ({
        id: row.id,
        baseMonth: row.baseMonth,
        sido: row.sido,
        sigungu: row.sigungu,
        nationality: row.nationality,
        gender: row.gender,
        residentCount: row.residentCount,
        longTermCount: row.longTermCount,
        shortTermCount: row.shortTermCount,
        yoyChangeRate: row.yoyChangeRate,
        momChangeRate: row.momChangeRate,
        sourceName: row.sourceName
      }))
    : fallbackRegionData;

const fallbackResidentStatus: ForeignResidentStatus[] = [
  {
    id: "s1",
    baseYear: 2025,
    nationality: "중국",
    visaCode: "F-4",
    visaName: "재외동포",
    segmentType: "재외동포",
    residentCount: 184000,
    financialNeedTags: ["장기거주 금융", "신용카드", "주거금융"]
  },
  {
    id: "s2",
    baseYear: 2025,
    nationality: "베트남",
    visaCode: "E-9",
    visaName: "비전문취업",
    segmentType: "비전문취업 근로자",
    residentCount: 93500,
    financialNeedTags: ["급여계좌", "본국송금", "다국어 상담"]
  },
  {
    id: "s3",
    baseYear: 2025,
    nationality: "우즈베키스탄",
    visaCode: "E-9",
    visaName: "비전문취업",
    segmentType: "비전문취업 근로자",
    residentCount: 48200,
    financialNeedTags: ["급여계좌", "본국송금", "소액저축"]
  },
  {
    id: "s4",
    baseYear: 2025,
    nationality: "몽골",
    visaCode: "D-2",
    visaName: "유학",
    segmentType: "유학생",
    residentCount: 21400,
    financialNeedTags: ["계좌개설", "체크카드", "등록금 납부"]
  },
  {
    id: "s5",
    baseYear: 2025,
    nationality: "중국",
    visaCode: "D-2",
    visaName: "유학",
    segmentType: "유학생",
    residentCount: 67200,
    financialNeedTags: ["계좌개설", "체크카드", "해외송금"]
  },
  {
    id: "s6",
    baseYear: 2025,
    nationality: "미국",
    visaCode: "E-7",
    visaName: "특정활동",
    segmentType: "전문인력",
    residentCount: 16800,
    financialNeedTags: ["급여계좌", "신용카드", "자산관리"]
  },
  {
    id: "s7",
    baseYear: 2025,
    nationality: "필리핀",
    visaCode: "F-6",
    visaName: "결혼이민",
    segmentType: "결혼이민",
    residentCount: 24700,
    financialNeedTags: ["생활금융", "가족계좌", "보험"]
  },
  {
    id: "s8",
    baseYear: 2025,
    nationality: "일본",
    visaCode: "C-3",
    visaName: "단기방문",
    segmentType: "단기체류",
    residentCount: 15300,
    financialNeedTags: ["환전", "선불카드", "간편결제"]
  }
];

export const sampleResidentStatus: ForeignResidentStatus[] =
  realDataSummary.statusRowCount > 0
    ? realForeignResidentStatus.map((row) => ({
        id: row.id,
        baseYear: row.baseYear,
        nationality: row.nationality,
        visaCode: row.visaCode,
        visaName: row.visaName,
        segmentType: row.segmentType as ForeignResidentSegment,
        residentCount: row.residentCount,
        financialNeedTags: [...row.financialNeedTags],
        sourceName: row.sourceName,
        sourceUrl: row.sourceUrl
      }))
    : fallbackResidentStatus;

export const sampleUniversityData: ForeignStudentUniversity[] = [
  {
    id: "u1",
    baseYear: 2025,
    universityName: "한국외국어대학교",
    campusName: "서울캠퍼스",
    universityType: "사립",
    sido: "서울특별시",
    sigungu: "동대문구",
    address: "서울특별시 동대문구 이문로",
    nationality: "몽골",
    degreeCourse: "학위과정",
    studentCount: 520,
    sourceName: "교육부 외국인 유학생 현황"
  },
  {
    id: "u2",
    baseYear: 2025,
    universityName: "성균관대학교",
    campusName: "서울캠퍼스",
    universityType: "사립",
    sido: "서울특별시",
    sigungu: "종로구",
    address: "서울특별시 종로구 성균관로",
    nationality: "중국",
    degreeCourse: "학위과정",
    studentCount: 1100,
    sourceName: "교육부 외국인 유학생 현황"
  },
  {
    id: "u3",
    baseYear: 2025,
    universityName: "부산대학교",
    campusName: "부산캠퍼스",
    universityType: "국립",
    sido: "부산광역시",
    sigungu: "금정구",
    address: "부산광역시 금정구 부산대학로",
    nationality: "베트남",
    degreeCourse: "학위과정",
    studentCount: 430,
    sourceName: "교육부 외국인 유학생 현황"
  },
  {
    id: "u4",
    baseYear: 2025,
    universityName: "한양대학교",
    campusName: "ERICA캠퍼스",
    universityType: "사립",
    sido: "경기도",
    sigungu: "안산시",
    address: "경기도 안산시 상록구 한양대학로",
    nationality: "우즈베키스탄",
    degreeCourse: "학위과정",
    studentCount: 360,
    sourceName: "교육부 외국인 유학생 현황"
  },
  {
    id: "u5",
    baseYear: 2025,
    universityName: "선문대학교",
    campusName: "아산캠퍼스",
    universityType: "사립",
    sido: "충청남도",
    sigungu: "아산시",
    address: "충청남도 아산시 탕정면",
    nationality: "베트남",
    degreeCourse: "어학연수",
    studentCount: 310,
    sourceName: "교육부 외국인 유학생 현황"
  }
];

export const sampleFinanceAggregates: FinanceSegmentAggregate[] = [
  {
    id: "f1",
    baseMonth: "2025-12-01",
    sido: "경기도",
    sigungu: "안산시",
    nationality: "우즈베키스탄",
    segmentType: "비전문취업 근로자",
    accountOpenCount: 920,
    debitCardIssueCount: 780,
    remittanceCount: 3400,
    remittanceAmount: 1750000000,
    fxExchangeCount: 610,
    payrollAccountCount: 1100,
    mobileForeignLanguageUserCount: 2400,
    averageBalance: 980000,
    delinquencyRate: 1.7,
    sourceName: "내부 금융 집계 샘플"
  },
  {
    id: "f2",
    baseMonth: "2025-12-01",
    sido: "서울특별시",
    sigungu: "동대문구",
    nationality: "몽골",
    segmentType: "유학생",
    accountOpenCount: 620,
    debitCardIssueCount: 590,
    remittanceCount: 1280,
    remittanceAmount: 480000000,
    fxExchangeCount: 450,
    payrollAccountCount: 120,
    mobileForeignLanguageUserCount: 980,
    averageBalance: 430000,
    delinquencyRate: 0.6,
    sourceName: "내부 금융 집계 샘플"
  },
  {
    id: "f3",
    baseMonth: "2025-12-01",
    sido: "충청남도",
    sigungu: "아산시",
    nationality: "베트남",
    segmentType: "비전문취업 근로자",
    accountOpenCount: 710,
    debitCardIssueCount: 650,
    remittanceCount: 2600,
    remittanceAmount: 1220000000,
    fxExchangeCount: 520,
    payrollAccountCount: 870,
    mobileForeignLanguageUserCount: 1780,
    averageBalance: 760000,
    delinquencyRate: 1.4,
    sourceName: "내부 금융 집계 샘플"
  }
];

const scoreSources: RegionScoreSource[] = [
  {
    id: "score-ansan",
    baseMonth: "2025-12-01",
    sido: "경기도",
    sigungu: "안산시",
    topNationality: "우즈베키스탄",
    dominantSegment: "비전문취업 근로자",
    residentCount: 14200,
    yoyChangeRate: 7.8,
    workerSegmentCount: 9200,
    studentSegmentCount: 800,
    universityForeignStudentCount: 360,
    nationalityConcentration: 0.42,
    nationalityDiversity: 0.71,
    newArrivalGrowthRate: 8.4,
    existingRemittanceCount: 3400,
    existingPayrollAccountCount: 1100
  },
  {
    id: "score-guro",
    baseMonth: "2025-12-01",
    sido: "서울특별시",
    sigungu: "구로구",
    topNationality: "중국",
    dominantSegment: "재외동포",
    residentCount: 28500,
    yoyChangeRate: 3.2,
    workerSegmentCount: 5200,
    studentSegmentCount: 1400,
    universityForeignStudentCount: 210,
    nationalityConcentration: 0.55,
    nationalityDiversity: 0.46,
    newArrivalGrowthRate: 3.7,
    existingRemittanceCount: 2100,
    existingPayrollAccountCount: 780
  },
  {
    id: "score-asan",
    baseMonth: "2025-12-01",
    sido: "충청남도",
    sigungu: "아산시",
    topNationality: "베트남",
    dominantSegment: "비전문취업 근로자",
    residentCount: 9800,
    yoyChangeRate: 9.4,
    workerSegmentCount: 7100,
    studentSegmentCount: 620,
    universityForeignStudentCount: 310,
    nationalityConcentration: 0.47,
    nationalityDiversity: 0.52,
    newArrivalGrowthRate: 9.1,
    existingRemittanceCount: 2600,
    existingPayrollAccountCount: 870
  },
  {
    id: "score-dongdaemun",
    baseMonth: "2025-12-01",
    sido: "서울특별시",
    sigungu: "동대문구",
    topNationality: "몽골",
    dominantSegment: "유학생",
    residentCount: 7600,
    yoyChangeRate: 5.4,
    workerSegmentCount: 900,
    studentSegmentCount: 3900,
    universityForeignStudentCount: 520,
    nationalityConcentration: 0.31,
    nationalityDiversity: 0.64,
    newArrivalGrowthRate: 5.6,
    existingRemittanceCount: 1280,
    existingPayrollAccountCount: 120
  },
  {
    id: "score-geumjeong",
    baseMonth: "2025-12-01",
    sido: "부산광역시",
    sigungu: "금정구",
    topNationality: "베트남",
    dominantSegment: "유학생",
    residentCount: 6200,
    yoyChangeRate: 6.6,
    workerSegmentCount: 1100,
    studentSegmentCount: 2600,
    universityForeignStudentCount: 430,
    nationalityConcentration: 0.29,
    nationalityDiversity: 0.58,
    newArrivalGrowthRate: 6.1,
    existingRemittanceCount: 780,
    existingPayrollAccountCount: 160
  },
  {
    id: "score-yeonsu",
    baseMonth: "2025-12-01",
    sido: "인천광역시",
    sigungu: "연수구",
    topNationality: "러시아",
    dominantSegment: "전문인력",
    residentCount: 5400,
    yoyChangeRate: 4.1,
    workerSegmentCount: 1800,
    studentSegmentCount: 700,
    universityForeignStudentCount: 120,
    nationalityConcentration: 0.24,
    nationalityDiversity: 0.67,
    newArrivalGrowthRate: 4.9,
    existingRemittanceCount: 620,
    existingPayrollAccountCount: 360
  }
];

export const sampleOpportunityRows: RegionOpportunityRow[] = calculateRegionScores(
  scoreSources
)
  .sort((a, b) => b.overallOpportunityScore - a.overallOpportunityScore)
  .map((row, index) => {
    const base = {
      ...row,
      rank: index + 1,
      recommendedAction: ""
    };

    return {
      ...base,
      recommendedAction: generateOpportunityAction(base)
    };
  });

export const sampleRegionInsights = sampleOpportunityRows.map((row) => ({
  id: row.id,
  title: `${row.sido} ${row.sigungu}`,
  body: generateRegionInsight(row),
  score: row.overallOpportunityScore
}));

export const sampleUniversityOpportunities: UniversityOpportunity[] =
  sampleUniversityData.map((university) => {
    const nearby =
      sampleRegionData.find(
        (region) =>
          region.sido === university.sido && region.sigungu === university.sigungu
      )?.residentCount ?? 0;
    const opportunityScore = Math.min(
      100,
      university.studentCount / 12 + nearby / 500
    );
    const topNationalities = [
      university.nationality ?? "기타",
      university.nationality === "중국" ? "베트남" : "중국"
    ];
    const base: UniversityOpportunity = {
      ...university,
      totalForeignStudents: university.studentCount,
      topNationalities,
      nearbyResidentCount: nearby,
      opportunityScore,
      recommendedCampaign: ""
    };

    return {
      ...base,
      recommendedCampaign: generateUniversityCampaign(base)
    };
  });

export const monthlyTrendData = [
  { month: "2025-07", 중국: 27400, 베트남: 8500, 우즈베키스탄: 12600, 몽골: 6800 },
  { month: "2025-08", 중국: 27650, 베트남: 8700, 우즈베키스탄: 13050, 몽골: 7000 },
  { month: "2025-09", 중국: 27920, 베트남: 9050, 우즈베키스탄: 13400, 몽골: 7250 },
  { month: "2025-10", 중국: 28100, 베트남: 9320, 우즈베키스탄: 13850, 몽골: 7420 },
  { month: "2025-11", 중국: 28360, 베트남: 9600, 우즈베키스탄: 14120, 몽골: 7510 },
  { month: "2025-12", 중국: 28500, 베트남: 9800, 우즈베키스탄: 14200, 몽골: 7600 }
];

export const nationalityDistributionData = [
  { nationality: "중국", residents: 28500, share: 31 },
  { nationality: "우즈베키스탄", residents: 14200, share: 15 },
  { nationality: "베트남", residents: 9800, share: 11 },
  { nationality: "몽골", residents: 7600, share: 8 },
  { nationality: "러시아", residents: 5400, share: 6 },
  { nationality: "필리핀", residents: 4200, share: 5 }
];

export const visaDistributionData: {
  name: ForeignResidentSegment;
  value: number;
}[] = [
  { name: "비전문취업 근로자", value: 36 },
  { name: "유학생", value: 22 },
  { name: "재외동포", value: 18 },
  { name: "전문인력", value: 9 },
  { name: "결혼이민", value: 8 },
  { name: "기타", value: 7 }
];

export const scoreRadarData = [
  {
    metric: "외국인 규모",
    안산시: 65,
    구로구: 100,
    동대문구: 18
  },
  {
    metric: "송금 수요",
    안산시: 100,
    구로구: 52,
    동대문구: 22
  },
  {
    metric: "유학생",
    안산시: 18,
    구로구: 24,
    동대문구: 100
  },
  {
    metric: "급여계좌",
    안산시: 100,
    구로구: 58,
    동대문구: 12
  },
  {
    metric: "다국어 상담",
    안산시: 88,
    구로구: 64,
    동대문구: 55
  }
];

export const kpiSummary = {
  totalResidents: sampleRegionData.reduce((sum, row) => sum + row.residentCount, 0),
  registeredResidents: sampleRegionData.reduce(
    (sum, row) => sum + (row.longTermCount ?? 0),
    0
  ),
  foreignLocalResidents: 2450000,
  foreignStudents: sampleUniversityData.reduce((sum, row) => sum + row.studentCount, 0),
  averageOpportunityScore:
    sampleOpportunityRows.reduce(
      (sum, row) => sum + row.overallOpportunityScore,
      0
    ) / sampleOpportunityRows.length
};
