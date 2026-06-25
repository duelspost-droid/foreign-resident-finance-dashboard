// scripts/build_real_data.mjs 순수 변환함수 테스트 (node:test).
// 데이터 정합성의 핵심(숫자 파싱·비자 분류·wide 감지·KOSIS 중복제거·급락 감지)을 회귀 방지.
// build_real_data.mjs 는 직접실행 가드가 있어 import 해도 배치 main()이 돌지 않는다.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toNumber,
  inferSegment,
  parseVisaColHeader,
  isWideFormat,
  readKosisDimRows,
  detectTrendAnomalies,
  periodToMonth
} from "../scripts/build_real_data.mjs";

test("toNumber: 콤마·공백 제거, 비수치는 0", () => {
  assert.equal(toNumber("1,234"), 1234);
  assert.equal(toNumber("  7 "), 7);
  assert.equal(toNumber("12.5"), 12.5);
  assert.equal(toNumber(""), 0);
  assert.equal(toNumber("abc"), 0);
  assert.equal(toNumber(null), 0);
});

test("inferSegment: 비자코드→세그먼트", () => {
  assert.equal(inferSegment("D-2", "유학"), "유학생");
  assert.equal(inferSegment("E-9", ""), "비전문취업 근로자");
  assert.equal(inferSegment("E-7", "특정활동"), "전문인력");
  assert.equal(inferSegment("F-6", "결혼이민"), "결혼이민");
  assert.equal(inferSegment("F-4", "재외동포"), "재외동포");
  assert.equal(inferSegment("ZZ", "알수없음"), "기타");
});

test("parseVisaColHeader: 'D2(유학)' → 코드/이름", () => {
  assert.deepEqual(parseVisaColHeader("D2(유학)"), { visaCode: "D-2", visaName: "유학" });
  assert.deepEqual(parseVisaColHeader("국적"), { visaCode: "국적", visaName: "국적" });
});

test("isWideFormat: 국적 있고 체류외국인수 없고 6컬럼 초과면 wide", () => {
  const wide = [{ __rowNumber: 2, 국적: "베트남", "D-2": "1", "E-9": "2", "F-6": "3", "H-2": "4", "F-4": "5", "기타": "6" }];
  assert.equal(isWideFormat(wide), true);
  const narrow = [{ __rowNumber: 2, 국적: "베트남", 체류외국인수: "100" }];
  assert.equal(isWideFormat(narrow), false);
  assert.equal(isWideFormat([]), false);
});

test("readKosisDimRows: (연도|분류|항목) 키로 중복 제거 + DT 수치화", () => {
  const rows = [
    { PRD_DE: "2024", C1_NM: "외국인", ITM_NM: "계", DT: "100" },
    { PRD_DE: "2024", C1_NM: "외국인", ITM_NM: "계", DT: "100" }, // 중복
    { PRD_DE: "2024", C1_NM: "외국인", ITM_NM: "합계", DT: "1,200" }
  ];
  const out = readKosisDimRows(rows);
  assert.equal(out.length, 2);
  assert.equal(out[0].value, 100);
  assert.equal(out[1].value, 1200);
});

test("detectTrendAnomalies: dropPct 이상 급락만 플래그", () => {
  const drop = detectTrendAnomalies([{ year: 2020, value: 100 }, { year: 2021, value: 60 }], { dropPct: 30 });
  assert.equal(drop.length, 1);
  assert.equal(drop[0].period, 2021);

  const mild = detectTrendAnomalies([{ year: 2020, value: 100 }, { year: 2021, value: 90 }], { dropPct: 20 });
  assert.equal(mild.length, 0); // -10% 는 임계 미만

  const covid = detectTrendAnomalies([{ year: 2019, value: 100 }, { year: 2020, value: 85.1 }], { dropPct: 20 });
  assert.equal(covid.length, 0); // -14.9% 정상 변동은 오탐 안 함
});

test("periodToMonth: YYYYMM/YYYY 변환", () => {
  assert.equal(periodToMonth("202403"), "2024-03-01");
  assert.equal(periodToMonth("2024"), "2024-12-01");
  assert.equal(periodToMonth("xx"), "2024-12-01");
});
