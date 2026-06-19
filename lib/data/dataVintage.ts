// 데이터 기준시점·공표 주기 안내.
// "수집일(배치 실행일)"과 "데이터 기준시점(원 통계의 빈티지)"이 다른 이유를 소스별로 투명하게 보여준다.
// 기준시점(asOf)은 실데이터 export에서 라이브로 끌어오고, 주기·사유는 공표 관행을 큐레이션한다.

import {
  realBopTransferIncome,
  realDutyFreeSales,
  realEpsIntroduction,
  realExchangeRate,
  realForeignAgeActivity,
  realForeignStudentNationality,
  realForeignWage,
  realKediStudentRegion,
  realStudentSummary
} from "./generated/realData";
import { sidoForeignerLatestYear } from "./regionAggregates";

export type Cadence = "실시간" | "월별" | "연간" | "부정기";

export type DataVintage = {
  label: string; // 데이터명
  asOf: string; // 기준시점(라이브)
  cadence: Cadence; // 공표 주기
  reason: string; // 왜 그 시점인지(공표 주기/지연)
};

const yearText = (n: number | null | undefined) => (n != null ? `${n}년` : "—");

function fxDate(): string {
  const latest = realExchangeRate.latest as { usd?: { date?: string } } | undefined;
  const d = latest?.usd?.date ?? ""; // "YYYYMMDD"
  return d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : "—";
}

function studentAsOf(): string {
  const s = realStudentSummary as { latestYear?: number | null; asOfMonth?: string | null };
  if (s.latestYear == null) return "—";
  return s.asOfMonth ? `${s.latestYear}.${s.asOfMonth}` : `${s.latestYear}년`;
}

export const dataVintages: DataVintage[] = [
  {
    label: "환율(원/달러·위안·엔·유로) · 한국은행 ECOS",
    asOf: fxDate(),
    cadence: "실시간",
    reason: "영업일 매매기준율. 거의 실시간으로 갱신됩니다."
  },
  {
    label: "이전소득수지·본국송금 대리지표 · ECOS",
    asOf: yearText(realBopTransferIncome.latestYear),
    cadence: "연간",
    reason: "국제수지 통계. 연간 확정치는 익년에 공표됩니다(월별은 더 최신)."
  },
  {
    label: "유학생 총계 · 법무부 출입국 통계월보",
    asOf: studentAsOf(),
    cadence: "월별",
    reason: "월보 기준이라 약 1개월 지연. 전체 소스 중 가장 최신 시점입니다."
  },
  {
    label: "유학생 국적·학위 · KOSIS(법무부)",
    asOf: yearText(realForeignStudentNationality.latestYear),
    cadence: "연간",
    reason: "KOSIS 연간표. 연말 기준이 익년에 등재됩니다(월보보다 늦음)."
  },
  {
    label: "시도별 유학생 · KEDI 고등교육기관",
    asOf: yearText(realKediStudentRegion.latestYear),
    cadence: "연간",
    reason: "연 1회 집계. 학년도 기준."
  },
  {
    label: "임금분포·EPS 도입·종사상지위·산업·연령 · KOSIS",
    asOf: yearText(realForeignWage.latestYear ?? realEpsIntroduction.latestYear ?? realForeignAgeActivity.latestYear),
    cadence: "연간",
    reason: "이민자체류실태·고용조사 등 연 1회 조사. 조사연도 기준."
  },
  {
    label: "시도별 외국인주민 · 행정안전부",
    asOf: yearText(sidoForeignerLatestYear),
    cadence: "연간",
    reason: "매년 11/1 기준으로 익년 하반기에 공표 → 현재는 해당 연도가 최신입니다."
  },
  {
    label: "국적 분포·체류자격 현황 · 법무부 연도별",
    asOf: "2024년",
    cadence: "연간",
    reason: "연도말 기준 연간 현황. 익년에 공표됩니다."
  },
  {
    label: "면세점 매출·외국인 토지취득 · data.go.kr",
    asOf: yearText(realDutyFreeSales.latestYear),
    cadence: "연간",
    reason: "연 1회 공개 파일. 1년 이상 지연될 수 있습니다."
  },
  {
    label: "외국인 건강보험 적용인구 · 국민건강보험공단",
    asOf: "2022년",
    cadence: "연간",
    reason: "공단이 공개한 최신 연도 기준."
  }
];
