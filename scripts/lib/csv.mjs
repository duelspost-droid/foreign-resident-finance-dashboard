// RFC 4180 호환 CSV 파서(공용). build_real_data·build_generic_data 가 각자 복제하던 파서를 통합.
// 핵심: 전체 텍스트를 문자 단위로 스캔해 **따옴표 밖의 개행만** 행 구분자로 인식한다.
//  → 따옴표 안 개행(멀티라인 셀)·따옴표 안 콤마·이스케이프된 따옴표("")를 올바르게 처리.
//  (기존 "줄바꿈으로 split 후 줄 단위 파싱"은 따옴표 안 개행에서 행이 깨졌다.)

// text → string[][] (행 배열, 각 행은 셀 문자열 배열). 셀은 trim 하지 않는다(호출부가 필요 시 trim).
// 완전 빈 행(콤마 없는 빈 줄/공백 줄)은 제거해 기존 `.filter(line=>line.trim())` 동작과 일치시킨다.
export function parseCsvRows(text) {
  const s = String(text ?? "").replace(/^﻿/, ""); // BOM 제거
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const n = s.length;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < n) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      endField();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      endRow();
      i += s[i + 1] === "\n" ? 2 : 1; // \r\n → 2, 단독 \r → 1
      continue;
    }
    if (ch === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  // 파일 끝에 개행이 없을 때 마지막 필드/행 flush.
  if (field.length > 0 || row.length > 0) {
    endRow();
  }

  // 빈 줄(콤마 없이 공백만인 행) 제거 — 기존 동작과 동일. `,,,`(빈 셀 다수)는 유지.
  return rows.filter((r) => !(r.length === 1 && r[0].trim().length === 0));
}
