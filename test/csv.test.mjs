// scripts/lib/csv.mjs 공용 CSV 파서 테스트 (node:test).
// 핵심: 따옴표 안 개행(멀티라인 셀)·따옴표 안 콤마·이스케이프("")·CRLF 를 올바르게 처리하는지.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsvRows } from "../scripts/lib/csv.mjs";

test("기본 CSV: 헤더 + 행", () => {
  assert.deepEqual(parseCsvRows("a,b,c\n1,2,3"), [["a", "b", "c"], ["1", "2", "3"]]);
});

test("따옴표 안 콤마는 셀 내부로 유지", () => {
  assert.deepEqual(parseCsvRows('name,note\n"kim, lee",x'), [["name", "note"], ["kim, lee", "x"]]);
});

test("따옴표 안 개행(멀티라인 셀) — 강화 핵심", () => {
  assert.deepEqual(parseCsvRows('a,b\n"line1\nline2",x'), [["a", "b"], ["line1\nline2", "x"]]);
});

test('이스케이프된 따옴표 ("")', () => {
  assert.deepEqual(parseCsvRows('q\n"say ""hi"""'), [["q"], ['say "hi"']]);
});

test("CRLF·단독 CR 모두 행 종료", () => {
  assert.deepEqual(parseCsvRows("a,b\r\n1,2\r3,4"), [["a", "b"], ["1", "2"], ["3", "4"]]);
});

test("빈 줄/공백 줄은 제거하되 콤마행(,,)은 유지", () => {
  assert.deepEqual(parseCsvRows("a\n\n  \n,,"), [["a"], ["", "", ""]]);
});

test("BOM 제거 + 파일 끝 개행 없음", () => {
  assert.deepEqual(parseCsvRows("﻿h1,h2\n1,2"), [["h1", "h2"], ["1", "2"]]);
});

test("빈/널 입력 → 빈 배열", () => {
  assert.deepEqual(parseCsvRows(""), []);
  assert.deepEqual(parseCsvRows(null), []);
});
