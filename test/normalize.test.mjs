// lib/data/normalize.ts 순수함수 테스트 (node:test).
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, normalizeCollection } from "../lib/data/normalize.ts";

test("normalize: [min,max]→[0,100] 클램프", () => {
  assert.equal(normalize(50, 0, 100), 50);
  assert.equal(normalize(0, 0, 100), 0);
  assert.equal(normalize(100, 0, 100), 100);
  assert.equal(normalize(150, 0, 100), 100); // 상한 클램프
  assert.equal(normalize(-10, 0, 100), 0); // 하한 클램프
  assert.equal(normalize(5, 5, 5), 0); // max===min → 0 (NaN 방지)
});

test("normalizeCollection: 빈 배열은 빈 Map", () => {
  assert.equal(normalizeCollection([], (r) => r.v).size, 0);
});

test("normalizeCollection: 최소→0, 최대→100", () => {
  const rows = [{ v: 10 }, { v: 20 }, { v: 30 }];
  const m = normalizeCollection(rows, (r) => r.v);
  assert.equal(m.get(rows[0]), 0);
  assert.equal(m.get(rows[2]), 100);
  assert.equal(m.get(rows[1]), 50);
});
