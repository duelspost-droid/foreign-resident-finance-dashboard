// 가상 외국인정보(mock_residents) 파일 내보내기 유틸 — 의존성 0(브라우저 API만).
// CSV/JSON은 Blob 다운로드, PDF는 인쇄용 창(window.print)로 처리한다.
// ⚠️ 전부 합성 데이터. 식별번호는 마스킹 합성만 포함.

import type { MockResident } from "./mockResidents";

const HEADERS = [
  "id",
  "이름",
  "성별",
  "생년월일",
  "주민등록번호",
  "외국인등록번호",
  "국적",
  "체류자격",
  "시도",
  "시군구",
  "등록일"
];

function toCells(r: MockResident): (string | number)[] {
  return [r.id, r.name, r.gender, r.birth, r.rrn, r.frn, r.nationality, r.visa, r.sido, r.sigungu, r.registeredAt];
}

// RFC 4180 CSV. Excel 한글 인식을 위해 UTF-8 BOM 포함.
export function toCsv(rows: MockResident[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => toCells(r).map(esc).join(","));
  return "﻿" + [HEADERS.join(","), ...body].join("\r\n");
}

export function toJson(rows: MockResident[]): string {
  return JSON.stringify(rows);
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// PDF는 별도 라이브러리 없이 인쇄용 창으로 처리(사용자가 '다른 이름으로 저장 → PDF').
// 대량 인쇄 방지를 위해 상위 PDF_CAP건만 렌더.
const PDF_CAP = 1000;

export function openPrintable(rows: MockResident[]): boolean {
  const esc = (v: string | number) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const shown = rows.slice(0, PDF_CAP);
  const trs = shown
    .map((r) => `<tr>${toCells(r).map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("");
  const capNote =
    rows.length > PDF_CAP
      ? `<p class="note">※ 인쇄본은 상위 ${PDF_CAP.toLocaleString()}건만 표시합니다(전체 ${rows.length.toLocaleString()}건). 전체는 CSV로 내보내세요.</p>`
      : `<p class="note">총 ${rows.length.toLocaleString()}건</p>`;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>외국인 정보 관리 (가상)</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Malgun Gothic","Apple SD Gothic Neo",sans-serif;padding:24px;color:#0f172a}
  h1{font-size:18px;margin:0 0 4px}
  .warn{color:#9f1239;font-weight:700;font-size:12px;margin:0 0 2px}
  .note{color:#64748b;font-size:11px;margin:2px 0 12px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th,td{border:1px solid #e2e8f0;padding:4px 6px;text-align:left;white-space:nowrap}
  th{background:#f1f5f9}
  @media print{@page{size:A4 landscape;margin:12mm}}
</style></head><body>
  <h1>외국인 정보 관리 (가상)</h1>
  <p class="warn">전부 가상(합성) 데이터 — 실제 개인정보 아님. 주민등록번호·외국인등록번호는 마스킹 합성.</p>
  ${capNote}
  <table><thead><tr>${HEADERS.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${trs}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false; // 팝업 차단
  w.document.write(html);
  w.document.close();
  return true;
}

export const EXPORT_FILENAME = (ext: string, n: number) => `mock_residents_${n}건.${ext}`;
