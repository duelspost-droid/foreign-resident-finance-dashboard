// 미연동 소스 '범용 미리보기/차트'용 데이터 생성기.
// data/raw 의 각 소스 최신 CSV를 파싱해 {columns, rows(상한), numericCols, rowCount} 로
// lib/data/generated/genericData.ts 에 emit 한다. 홈 '추가 데이터' 섹션이 관리자가 토글한
// 소스를 이 데이터로 자동 차트/표 렌더한다. (변환 로직 없이 어떤 소스든 노출 가능)
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const RAW_DIR = "data/raw";
const OUT = "lib/data/generated/genericData.ts";
const MAX_ROWS = 40; // 미리보기 상한(번들 크기 보호)
const MAX_COLS = 14;

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') { current += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { result.push(current); current = ""; }
    else current += char;
  }
  result.push(current);
  return result;
}

function parseCsvRows(text) {
  const clean = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return clean.split("\n").filter((l) => l.trim().length > 0).map(parseCsvLine);
}

function decodeCsv(buffer) {
  const decoders = ["utf-8", "euc-kr", "windows-949"];
  const scored = decoders.map((encoding) => {
    let text = "";
    try { text = new TextDecoder(encoding).decode(buffer); }
    catch { return { text: "", score: -1 }; }
    const replacementPenalty = (text.match(/�/g) ?? []).length * -20;
    const koreanScore = (text.match(/[가-힣]/g) ?? []).length;
    const commaScore = (text.match(/,/g) ?? []).length;
    return { text, score: replacementPenalty + koreanScore + commaScore };
  });
  return scored.sort((a, b) => b.score - a.score)[0].text;
}

const isNum = (v) => {
  const s = String(v ?? "").replace(/,/g, "").trim();
  return s !== "" && Number.isFinite(Number(s));
};

// 측정값(차트 Y) 후보에서 제외할 컬럼: 이름이 연도/코드/번호/일련번호 등.
const ID_OR_YEAR_RE = /번호|일련|순번|연번|코드|행번|연도|year|^년$|^no\.?$|^id$|seq|index|rownum/i;
// 값이 대부분 4자리 연도(19xx/20xx)면 측정값이 아니라 범주(연도축).
const looksYear = (v) => /^(19|20)\d{2}$/.test(String(v ?? "").trim());

// ⚠️ 개인정보(PII) 컬럼명 — 성명·주소·연락처 등은 정적 export 번들(공개 배포)에 절대 포함 금지.
const PII_COL_RE = /대표자|대표명|성명|이름|성함|주소|소재지|전화|연락처|휴대|이메일|e-?mail|생년|주민|여권|등록번호|fax|팩스/i;
// 본질이 개인/사업자 명부(성명+주소 위주)라 집계 가치가 없고 PII 위주인 소스는 통째 제외.
const PII_SOURCE_SKIP = new Set(["academyinfo_university_stats", "academyinfo_foreign_student_count"]);

// .xlsx/.xls → 행 배열(문자열의 2차원). xlsx 라이브러리 미설치/파싱 실패 시 null(스킵).
// 동적 import + try/catch라 라이브러리가 없어도 기존 CSV 파이프라인엔 영향 없음.
async function xlsxToRows(buffer) {
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return null;
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: "" });
    return aoa.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? "")) : []));
  } catch (e) {
    console.warn(`xlsx 파싱 스킵: ${e.message}`);
    return null;
  }
}

const files = (await readdir(RAW_DIR)).filter((f) => /\.(csv|xlsx|xls)$/i.test(f));
const byId = new Map();
for (const f of files) {
  const m = f.match(/^(.*?)_(\d{4}-\d{2}-\d{2})\.(?:csv|xlsx|xls)$/i);
  if (!m) continue;
  const [, id, date] = m;
  const cur = byId.get(id);
  if (!cur || date > cur.date) byId.set(id, { file: f, date });
}

const out = {};
for (const [id, { file }] of [...byId.entries()].sort()) {
  if (PII_SOURCE_SKIP.has(id)) continue; // 개인/사업자 명부성 소스는 통째 제외
  try {
    const buf = await readFile(join(RAW_DIR, file));
    const parsed = /\.xlsx?$/i.test(file) ? await xlsxToRows(buf) : parseCsvRows(decodeCsv(buf));
    if (!parsed) continue; // xlsx 파싱 실패/라이브러리 없음 → 스킵
    const rowsAll = parsed.filter((r) => r.some((c) => String(c).trim()));
    if (rowsAll.length < 2) continue;
    const rawHeader = rowsAll[0].slice(0, MAX_COLS).map((h) => String(h).trim() || "—");
    // PII 컬럼(성명·주소·연락처 등)은 번들에 포함하지 않도록 컬럼 단위로 제거.
    const keep = rawHeader.map((h, i) => (PII_COL_RE.test(h) ? -1 : i)).filter((i) => i >= 0);
    if (keep.length === 0) continue;
    const header = keep.map((i) => rawHeader[i]);
    const body = rowsAll.slice(1);
    const sample = body.slice(0, 30);
    const numericCols = header
      .map((h, hi) => {
        if (ID_OR_YEAR_RE.test(h)) return -1; // 이름이 연도/코드/번호 → 측정값 아님
        const vals = sample.map((r) => r[keep[hi]]);
        const numCount = vals.filter((v) => isNum(v)).length;
        if (numCount < Math.max(1, sample.length * 0.7)) return -1;
        const yearCount = vals.filter(looksYear).length;
        if (numCount > 0 && yearCount >= numCount * 0.8) return -1; // 값이 대부분 연도 → 범주
        return hi;
      })
      .filter((i) => i >= 0);
    const rows = body.slice(0, MAX_ROWS).map((r) => keep.map((i) => String(r[i] ?? "").trim()));
    out[id] = { columns: header, rows, numericCols, rowCount: body.length };
  } catch (e) {
    console.warn(`skip ${id}: ${e.message}`);
  }
}

const ts =
  `// AUTO-GENERATED by scripts/build_generic_data.mjs — 편집 금지.\n` +
  `// 미연동 소스 범용 미리보기/차트용. 홈 '추가 데이터' 섹션이 토글된 소스를 이 데이터로 렌더.\n` +
  `export type GenericSource = { columns: string[]; rows: string[][]; numericCols: number[]; rowCount: number };\n` +
  `export const genericSources: Record<string, GenericSource> = ${JSON.stringify(out)};\n`;

await writeFile(OUT, ts);
console.log(`generic sources emitted: ${Object.keys(out).length} → ${OUT}`);
