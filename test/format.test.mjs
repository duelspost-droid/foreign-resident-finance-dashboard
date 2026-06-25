// lib/utils/format.ts 순수함수 테스트 (node:test, 추가 의존 없음).
// 개인정보 방어의 핵심인 maskSmallCell + 점수 색/라벨 경계값 회귀 방지.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  maskSmallCell,
  scoreColor,
  scoreTierLabel,
  formatNumber,
  formatCurrencyKrw,
  formatPercent
} from "../lib/utils/format.ts";

test("maskSmallCell: 정수 1~4만 '<5'로 마스킹", () => {
  for (const v of ["1", "2", "3", "4"]) {
    assert.deepEqual(maskSmallCell(v), { text: "<5", masked: true });
  }
});

test("maskSmallCell: 5 이상·0은 그대로", () => {
  assert.deepEqual(maskSmallCell("5"), { text: "5", masked: false });
  assert.deepEqual(maskSmallCell("0"), { text: "0", masked: false });
  assert.deepEqual(maskSmallCell("100"), { text: "100", masked: false });
});

test("maskSmallCell: 연도·코드·소수·텍스트는 마스킹 안 함", () => {
  assert.equal(maskSmallCell("2024").masked, false); // 연도
  assert.equal(maskSmallCell("11").masked, false); // 코드
  assert.equal(maskSmallCell("3.5").masked, false); // 소수
  assert.equal(maskSmallCell("서울").masked, false); // 텍스트
  assert.deepEqual(maskSmallCell(""), { text: "", masked: false });
});

test("maskSmallCell: 천단위 콤마 제거 후 판정", () => {
  assert.equal(maskSmallCell("1,234").masked, false); // 1234 → 마스킹 X
  assert.deepEqual(maskSmallCell("3").masked, true); // 비교용
});

test("scoreColor: 72/55/40 경계 색상", () => {
  assert.equal(scoreColor(72), "#0f766e");
  assert.equal(scoreColor(71.9), "#3157a4");
  assert.equal(scoreColor(55), "#3157a4");
  assert.equal(scoreColor(40), "#b45309");
  assert.equal(scoreColor(39.9), "#be123c");
});

test("scoreTierLabel: 색상과 동일 경계", () => {
  assert.equal(scoreTierLabel(72), "최우선");
  assert.equal(scoreTierLabel(55), "우선");
  assert.equal(scoreTierLabel(40), "관찰");
  assert.equal(scoreTierLabel(39), "후순위");
});

test("formatNumber/formatPercent/formatCurrencyKrw", () => {
  assert.equal(formatNumber(1234567), "1,234,567");
  assert.equal(formatPercent(12.345), "12.3%");
  assert.equal(formatCurrencyKrw(150000000), "1.5억원");
  assert.equal(formatCurrencyKrw(50000), "5만원");
  assert.equal(formatCurrencyKrw(5000), "5,000원");
});
