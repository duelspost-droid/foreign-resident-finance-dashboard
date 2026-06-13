import type { ForeignResidentSegment } from "./foreignResident";

export type FinanceSegmentAggregate = {
  id: string;
  baseMonth: string;
  sido?: string;
  sigungu?: string;
  dong?: string;
  universityName?: string;
  nationality?: string;
  segmentType?: ForeignResidentSegment;
  accountOpenCount?: number;
  debitCardIssueCount?: number;
  remittanceCount?: number;
  remittanceAmount?: number;
  fxExchangeCount?: number;
  payrollAccountCount?: number;
  mobileForeignLanguageUserCount?: number;
  averageBalance?: number;
  delinquencyRate?: number;
  sourceName?: string;
};
