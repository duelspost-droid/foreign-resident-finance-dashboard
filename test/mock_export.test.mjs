import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv, toJson } from "../lib/data/mockResidentsExport.ts";

const row = {
  id: 1,
  name: "Zhang Wei",
  gender: "남",
  birth: "1985-03-05",
  rrn: "850305-1●●●●●●",
  frn: "850305-5●●●●●●",
  nationality: "중국",
  visa: "E-9",
  sido: "경기도",
  sigungu: "안산시",
  registeredAt: "2020-06-12"
};

test("toCsv: BOM + 헤더 + 행", () => {
  const csv = toCsv([row]);
  assert.ok(csv.startsWith("﻿"), "UTF-8 BOM 선행");
  const lines = csv.slice(1).split("\r\n");
  assert.equal(lines[0], "id,이름,성별,생년월일,주민등록번호,외국인등록번호,국적,체류자격,시도,시군구,등록일");
  assert.equal(lines[1], "1,Zhang Wei,남,1985-03-05,850305-1●●●●●●,850305-5●●●●●●,중국,E-9,경기도,안산시,2020-06-12");
});

test("toCsv: 콤마·따옴표·개행 이스케이프", () => {
  const csv = toCsv([{ ...row, name: 'A,B "C"', sigungu: "x\ny" }]);
  const dataLine = csv.slice(1).split("\r\n")[1];
  assert.ok(dataLine.includes('"A,B ""C"""'), "콤마·따옴표 필드는 큰따옴표로 감싸고 따옴표 이스케이프");
  assert.ok(dataLine.includes('"x\ny"'), "개행 포함 필드는 인용");
});

test("toJson: 유효한 JSON 배열 왕복", () => {
  const parsed = JSON.parse(toJson([row]));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, "Zhang Wei");
  assert.equal(parsed[0].rrn, "850305-1●●●●●●");
});
