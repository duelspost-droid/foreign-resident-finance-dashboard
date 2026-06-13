export type ForeignResidentSegment =
  | "유학생"
  | "어학연수생"
  | "비전문취업 근로자"
  | "전문인력"
  | "재외동포"
  | "결혼이민"
  | "단기체류"
  | "기타";

export type ForeignResidentRegionMonth = {
  id: string;
  baseMonth: string;
  sido: string;
  sigungu: string;
  nationality: string;
  gender?: string;
  residentCount: number;
  shortTermCount?: number;
  longTermCount?: number;
  yoyChangeRate?: number;
  momChangeRate?: number;
  sourceName?: string;
  sourceUrl?: string;
};

export type ForeignResidentStatus = {
  id: string;
  baseMonth?: string;
  baseYear?: number;
  nationality: string;
  visaCode?: string;
  visaName?: string;
  segmentType: ForeignResidentSegment;
  residentCount: number;
  financialNeedTags: string[];
  sourceName?: string;
  sourceUrl?: string;
};

export type RegionFinanceScore = {
  id: string;
  baseMonth: string;
  sido: string;
  sigungu: string;
  nationality?: string;
  segmentType?: ForeignResidentSegment;
  foreignPopulationScore: number;
  remittanceNeedScore: number;
  studentFinanceScore: number;
  payrollNeedScore: number;
  multilingualCsScore: number;
  overallOpportunityScore: number;
};

export type RegionOpportunityRow = RegionFinanceScore & {
  rank: number;
  residentCount: number;
  yoyChangeRate: number;
  topNationality: string;
  dominantSegment: ForeignResidentSegment;
  recommendedAction: string;
};
