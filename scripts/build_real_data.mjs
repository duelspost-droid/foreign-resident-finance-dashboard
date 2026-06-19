import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { publicDataSources } from "./data_sources.mjs";

const root = process.cwd();
const rawDir = join(root, "data", "raw");
const processedDir = join(root, "data", "processed");
const catalogDir = join(root, "data", "catalog");
const generatedDir = join(root, "lib", "data", "generated");

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const row = { __rowNumber: index + 2 };
    headers.forEach((header, cellIndex) => {
      row[header || `column_${cellIndex + 1}`] = cells[cellIndex]?.trim() ?? "";
    });
    return row;
  });
}

function decodeCsv(buffer) {
  const decoders = ["utf-8", "euc-kr", "windows-949"];
  const scored = decoders.map((encoding) => {
    let text = "";
    try {
      text = new TextDecoder(encoding).decode(buffer);
    } catch {
      return { encoding, text: "", score: -1 };
    }
    const replacementPenalty = (text.match(/\uFFFD/g) ?? []).length * -20;
    const koreanScore = (text.match(/[가-힣]/g) ?? []).length;
    const commaScore = (text.match(/,/g) ?? []).length;
    return {
      encoding,
      text,
      score: replacementPenalty + koreanScore + commaScore
    };
  });
  return scored.sort((a, b) => b.score - a.score)[0].text;
}

function toNumber(value) {
  if (typeof value !== "string") return Number(value ?? 0);
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstValue(row, candidates) {
  for (const key of Object.keys(row)) {
    const compact = key.replace(/\s/g, "");
    if (candidates.some((candidate) => compact.includes(candidate))) {
      return row[key];
    }
  }
  return "";
}

function inferSegment(visaCode, visaName) {
  const v = `${visaCode} ${visaName}`.toUpperCase();
  if (/D-?2|유학/.test(v)) return "유학생";
  if (/D-?4|어학연수|일반연수/.test(v)) return "어학연수생";
  if (/E-?9|비전문취업|계절근로/.test(v)) return "비전문취업 근로자";
  if (/E-?[1-8]|전문인력|특정활동|교수|회화|연구|기술지도|전문직|예술흥행|주재|무역|구직|선원/.test(v)) return "전문인력";
  if (/F-?4|재외동포/.test(v)) return "재외동포";
  if (/F-?[25]|H-?2|영주|거주|방문취업/.test(v)) return "재외동포";
  if (/F-?6|결혼이민/.test(v)) return "결혼이민";
  if (/[ABC]-?\d|단기|관광|통과|사증면제|외교|공무|취재/.test(v)) return "단기체류";
  return "기타";
}

function needsForSegment(segment) {
  return {
    유학생: ["계좌개설", "체크카드", "등록금 납부", "해외송금"],
    어학연수생: ["계좌개설", "체크카드", "생활비 송금", "환전"],
    "비전문취업 근로자": ["급여계좌", "본국송금", "소액저축", "다국어 상담"],
    전문인력: ["급여계좌", "신용카드", "고액송금", "자산관리"],
    재외동포: ["장기거주 금융", "신용카드", "주거금융"],
    결혼이민: ["생활금융", "가족계좌", "보험"],
    단기체류: ["환전", "선불카드", "간편결제"],
    기타: ["기본 계좌", "체크카드", "외국어 상담"]
  }[segment] ?? ["기본 계좌"];
}

// 열 헤더에서 "D2(유학)" → { code: "D-2", name: "유학" } 추출.
function parseVisaColHeader(col) {
  const m = col.match(/^([A-Z]+\d+[a-z]?\d*)\((.+)\)$/);
  if (m) {
    const rawCode = m[1];
    const visaCode = rawCode.replace(/([A-Z]+)(\d)/, "$1-$2");
    return { visaCode, visaName: m[2] };
  }
  return { visaCode: col, visaName: col };
}

// 가로형(wide) MOJ CSV 감지 — 국적 컬럼은 있으나 체류외국인수 컬럼이 없으면 wide.
function isWideFormat(rows) {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]).filter((k) => k !== "__rowNumber");
  return headers.includes("국적") && !headers.includes("체류외국인수") && headers.length > 6;
}

// Wide CSV → 국적별 합계 ForeignResidentStatus 레코드 (남녀 합산).
// 체류외국인 국적별 현황: 대륙, 국적, 성별, [비자컬럼...]
function transformStatus(rows) {
  if (!isWideFormat(rows)) {
    // 기존 narrow 포맷 폴백
    return rows.map((row, index) => {
      const nationality = firstValue(row, ["국적", "지역"]);
      const visaCode = firstValue(row, ["체류자격", "비자"]);
      const visaName = firstValue(row, ["체류자격명", "자격명"]);
      const residentCount = toNumber(firstValue(row, ["체류외국인수", "인원", "계"]));
      const segmentType = inferSegment(visaCode, visaName);
      return {
        id: `real-status-${index + 1}`,
        baseYear: 2024,
        nationality,
        visaCode,
        visaName,
        segmentType,
        residentCount,
        financialNeedTags: needsForSegment(segmentType),
        sourceName: "공공데이터포털 법무부 체류외국인 국적 및 체류자격별 현황",
        sourceUrl: "https://www.data.go.kr/data/3045188/fileData.do"
      };
    }).filter((row) => row.nationality || row.visaCode || row.residentCount > 0);
  }

  // Wide 포맷: 국적×성별 행 → 비자컬럼 합산 → 국적별 총계 레코드
  const headers = Object.keys(rows[0]).filter((k) => k !== "__rowNumber");
  const visaCols = headers.slice(3);
  const natMap = new Map();
  for (const row of rows) {
    const nationality = (row["국적"] ?? "").trim();
    if (!nationality) continue;
    let total = 0;
    for (const col of visaCols) total += toNumber(row[col]);
    natMap.set(nationality, (natMap.get(nationality) ?? 0) + total);
  }
  return [...natMap.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([nationality, residentCount], i) => ({
      id: `real-status-${i + 1}`,
      baseYear: 2024,
      nationality,
      visaCode: "",
      visaName: "",
      segmentType: "기타",
      residentCount,
      financialNeedTags: ["기본 계좌", "체크카드", "외국어 상담"],
      sourceName: "공공데이터포털 법무부 체류외국인 국적 및 체류자격별 현황",
      sourceUrl: "https://www.data.go.kr/data/3045188/fileData.do"
    }));
}

// Wide CSV → 국적 분포(residents/share) + 비자 세그먼트 분포.
// 두 MOJ 파일 중 어느 쪽이든 동일 로직으로 집계.
function aggregateStatusWide(rows, sourceName, sourceUrl) {
  if (!isWideFormat(rows)) return { nationals: [], visaTypes: [], visaSegments: [] };
  const headers = Object.keys(rows[0]).filter((k) => k !== "__rowNumber");
  const visaCols = headers.slice(3);

  const natMap = new Map();
  const visaMap = new Map();
  for (const row of rows) {
    const nationality = (row["국적"] ?? "").trim();
    if (!nationality) continue;
    for (const col of visaCols) {
      const count = toNumber(row[col]);
      if (!count) continue;
      natMap.set(nationality, (natMap.get(nationality) ?? 0) + count);
      const prev = visaMap.get(col) ?? { ...parseVisaColHeader(col), count: 0 };
      prev.count += count;
      visaMap.set(col, prev);
    }
  }

  const grandTotal = [...natMap.values()].reduce((s, v) => s + v, 0) || 1;
  const nationals = [...natMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nationality, residents]) => ({
      nationality,
      residents,
      share: Number(((residents / grandTotal) * 100).toFixed(1))
    }));

  const visaTypes = [...visaMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map((v) => ({ ...v, segment: inferSegment(v.visaCode, v.visaName) }));

  const segMap = new Map();
  for (const v of visaMap.values()) {
    const seg = inferSegment(v.visaCode, v.visaName);
    segMap.set(seg, (segMap.get(seg) ?? 0) + v.count);
  }
  const segTotal = [...segMap.values()].reduce((s, v) => s + v, 0) || 1;
  const visaSegments = [...segMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, value: Number(((count / segTotal) * 100).toFixed(1)) }));

  return { nationals, visaTypes, visaSegments };
}

function summarizeStatus(statusRows) {
  const byNationality = new Map();
  for (const row of statusRows) {
    const current = byNationality.get(row.nationality) ?? {
      nationality: row.nationality,
      residentCount: 0,
      segments: new Map()
    };
    current.residentCount += row.residentCount;
    current.segments.set(
      row.segmentType,
      (current.segments.get(row.segmentType) ?? 0) + row.residentCount
    );
    byNationality.set(row.nationality, current);
  }

  return [...byNationality.values()]
    .map((item, index) => {
      return {
        id: `real-region-${index + 1}`,
        baseMonth: "2024-12-01",
        sido: "전국",
        sigungu: "전국",
        nationality: item.nationality,
        gender: "전체",
        residentCount: item.residentCount,
        longTermCount: item.residentCount,
        shortTermCount: 0,
        yoyChangeRate: 0,
        momChangeRate: 0,
        sourceName: "공공데이터포털 법무부 체류외국인 국적 및 체류자격별 현황"
      };
    })
    .sort((a, b) => b.residentCount - a.residentCount);
}

// 법무부 연도별 외국인 유학생 체류현황 CSV: 연도 × 체류자격 × 인원.
// 컬럼 예: 연도 / 체류자격(유학D2·한국어연수D41·외국어연수D47) / 외국인 유학생 수.
function transformStudentStay(rows) {
  return rows
    .map((row) => {
      const year = toNumber(firstValue(row, ["년", "연도", "year"]));
      const visaRaw = String(firstValue(row, ["구분", "체류자격", "자격"])).trim();
      const count = toNumber(firstValue(row, ["외국인유학생", "유학생", "인원", "학생"]));
      // 학위과정(D-2) vs 어학연수(D-4) 2분류
      const isLanguage = visaRaw.includes("연수") || /D[-\s]?4/i.test(visaRaw);
      const course = isLanguage ? "어학연수(D-4)" : "학위과정(D-2)";
      return { year, visaRaw, course, count };
    })
    .filter((r) => r.year >= 2000 && r.year <= 2100 && r.visaRaw);
}

// 유학생 시계열을 연도별 합계·체류자격별 구성·최신연도 요약으로 집계.
function summarizeStudents(studentRows) {
  const byYear = new Map();
  for (const r of studentRows) {
    const cur = byYear.get(r.year) ?? { year: r.year, total: 0, degree: 0, language: 0 };
    cur.total += r.count;
    if (r.course.startsWith("어학")) cur.language += r.count;
    else cur.degree += r.count;
    byYear.set(r.year, cur);
  }
  const yearSeries = [...byYear.values()].sort((a, b) => a.year - b.year);
  const latest = yearSeries.at(-1) ?? null;
  const prev = yearSeries.at(-2) ?? null;
  const latestYear = latest?.year ?? null;

  const byVisa = studentRows
    .filter((r) => r.year === latestYear)
    .map((r) => ({ visaRaw: r.visaRaw, course: r.course, count: r.count }))
    .sort((a, b) => b.count - a.count);

  const yoy =
    latest && prev && prev.total > 0
      ? Number((((latest.total - prev.total) / prev.total) * 100).toFixed(1))
      : 0;

  return {
    yearSeries,
    byVisa,
    summary: {
      hasData: yearSeries.length > 0,
      latestYear,
      total: latest?.total ?? 0,
      degree: latest?.degree ?? 0,
      language: latest?.language ?? 0,
      yoy
    }
  };
}

// 월별 유학생 데이터셋(15100039: 년,월,국적지역,구분,유학생수) → 연도별 최신월 스톡 추세.
// 연도말 단독표(15100038)의 2024 행 손상(유학 D-2가 실제 178,519의 절반인 85,256으로 기록)·2024 고정 문제를
// 해결한다. 월별표는 2022~최신월(2026.4)까지 정확하며 2022·2023 값은 15100038과 일치(교차검증 완료, 2026-06-16).
function summarizeStudentsMonthly(rows) {
  const parsed = rows
    .map((r) => ({
      year: toNumber(firstValue(r, ["년", "연도", "year"])),
      month: String(firstValue(r, ["월", "month"])).padStart(2, "0"),
      gubun: String(firstValue(r, ["구분", "체류자격", "자격"])).trim(),
      count: toNumber(firstValue(r, ["유학생수", "인원", "학생수", "학생"]))
    }))
    .filter((r) => r.year >= 2000 && r.year <= 2100 && r.gubun);
  if (!parsed.length) return null;
  const isLang = (g) => /연수/.test(g) || /D[-\s]?4/i.test(g);
  const years = [...new Set(parsed.map((r) => r.year))].sort((a, b) => a - b);
  const snapshotOf = (year) => {
    const yr = parsed.filter((r) => r.year === year);
    const maxM = [...new Set(yr.map((r) => r.month))].sort().at(-1);
    return { month: maxM, rows: yr.filter((r) => r.month === maxM) };
  };
  const yearSeries = years.map((year) => {
    const { month, rows: snap } = snapshotOf(year);
    let degree = 0;
    let language = 0;
    for (const r of snap) {
      if (isLang(r.gubun)) language += r.count;
      else degree += r.count;
    }
    return { year, total: degree + language, degree, language, asOfMonth: month };
  });
  const latest = yearSeries.at(-1);
  // 스톡 시계열의 정확한 YoY: 최신월의 전년 동월 스톡과 비교.
  const sameMonthPrev = parsed.filter((r) => r.year === latest.year - 1 && r.month === latest.asOfMonth);
  let yoy = 0;
  if (sameMonthPrev.length) {
    const prevTot = sameMonthPrev.reduce((s, r) => s + r.count, 0);
    if (prevTot > 0) yoy = Number((((latest.total - prevTot) / prevTot) * 100).toFixed(1));
  }
  const { rows: latestSnap } = snapshotOf(latest.year);
  const visaAgg = new Map();
  for (const r of latestSnap) {
    const course = isLang(r.gubun) ? "어학연수(D-4)" : "학위과정(D-2)";
    const cur = visaAgg.get(r.gubun) ?? { visaRaw: r.gubun, course, count: 0 };
    cur.count += r.count;
    visaAgg.set(r.gubun, cur);
  }
  const byVisa = [...visaAgg.values()].sort((a, b) => b.count - a.count);
  return {
    yearSeries,
    byVisa,
    summary: {
      hasData: true,
      latestYear: latest.year,
      asOfMonth: latest.asOfMonth,
      total: latest.total,
      degree: latest.degree,
      language: latest.language,
      yoy
    }
  };
}

// JDC 면세점 국적별 매출(국적,판매년월,매출): 외국인 국적별 연매출 + 월별 외국인 총매출 추세.
function buildDutyFreeSales(rows) {
  const parsed = (rows ?? [])
    .map((r) => ({
      nat: String(firstValue(r, ["국적"])).trim(),
      ym: String(firstValue(r, ["판매년월"])).trim(),
      sales: toNumber(firstValue(r, ["매출"]))
    }))
    .filter((r) => r.nat && /^\d{4}/.test(r.ym));
  if (!parsed.length) return { latestYear: null, unit: "원", byNationality: [], monthly: [], foreignTotal: 0, internalTotal: 0 };
  const yearOf = (ym) => Number(ym.slice(0, 4));
  const ly = Math.max(...parsed.map((r) => yearOf(r.ym)));
  const isInternal = (n) => /내국인/.test(n);
  const natAgg = new Map();
  for (const r of parsed.filter((r) => yearOf(r.ym) === ly && !isInternal(r.nat))) {
    natAgg.set(r.nat, (natAgg.get(r.nat) ?? 0) + r.sales);
  }
  const byNationality = [...natAgg.entries()].map(([nationality, value]) => ({ nationality, value })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  const monAgg = new Map();
  for (const r of parsed.filter((r) => !isInternal(r.nat))) {
    const m = r.ym.slice(0, 7);
    monAgg.set(m, (monAgg.get(m) ?? 0) + r.sales);
  }
  const monthly = [...monAgg.entries()].map(([month, value]) => ({ month, value })).sort((a, b) => a.month.localeCompare(b.month));
  const foreignTotal = byNationality.reduce((s, r) => s + r.value, 0);
  const internalTotal = parsed.filter((r) => yearOf(r.ym) === ly && isInternal(r.nat)).reduce((s, r) => s + r.sales, 0);
  return { latestYear: ly, unit: "원", byNationality, monthly, foreignTotal, internalTotal };
}

// 제주 외국인 토지취득: 유형=국적별 패널에서 구분=국적, 12개월 취득금액(백만원) 합산 → 국적별 연취득금액.
function buildForeignLandAcquisition(rows) {
  if (!rows?.length) return { latestYear: null, unit: "백만원", byNationality: [], total: 0 };
  const headers = Object.keys(rows[0]).filter((k) => k !== "__rowNumber");
  const amtCols = headers.filter((h) => /취득\s?금액/.test(h));
  const yearOf = (r) => toNumber(firstValue(r, ["연도", "년도", "year"]));
  const years = rows.map(yearOf).filter((y) => y >= 2000);
  const ly = years.length ? Math.max(...years) : null;
  const natPanel = rows.filter((r) => String(firstValue(r, ["유형"])).trim() === "국적별" && (!ly || yearOf(r) === ly));
  const agg = new Map();
  for (const r of natPanel) {
    const nat = String(firstValue(r, ["구분"])).trim();
    if (!nat || /합계|소계|계$|전체|총/.test(nat)) continue;
    const amt = amtCols.reduce((s, c) => s + toNumber(r[c]), 0);
    agg.set(nat, (agg.get(nat) ?? 0) + amt);
  }
  const byNationality = [...agg.entries()].map(([nationality, value]) => ({ nationality, value })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  return { latestYear: ly, unit: "백만원", byNationality, total: byNationality.reduce((s, r) => s + r.value, 0) };
}

// 직전 커밋된 realData.ts에서 특정 export의 값을 추출한다(공공 API 일시장애 시 last-good 보존용).
// `= ` 뒤의 첫 `{`/`[` 부터 균형 잡힌 끝 위치까지 잘라낸다(문자열 인지) → 뒤따르는 ` as const;`·주석에 영향 안 받음.
function extractPrevExport(prevText, name) {
  if (!prevText) return null;
  const marker = `export const ${name}`;
  const i = prevText.indexOf(marker);
  if (i < 0) return null;
  let p = prevText.indexOf("=", i + marker.length);
  if (p < 0) return null;
  p += 1;
  while (p < prevText.length && /\s/.test(prevText[p])) p += 1;
  const open = prevText[p];
  if (open !== "{" && open !== "[") return null;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let k = p; k < prevText.length; k += 1) {
    const ch = prevText[k];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') {
      inStr = true;
    } else if (ch === open) {
      depth += 1;
    } else if (ch === close) {
      depth -= 1;
      if (depth === 0) { end = k + 1; break; }
    }
  }
  if (end < 0) return null;
  try { return JSON.parse(prevText.slice(p, end)); } catch { return null; }
}

// 파서 결과가 비어있을 때 실제 컬럼명을 로그 출력 (다음 런에서 파서 수정 확인용).
function logColumnDiag(label, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]).filter((k) => k !== "__rowNumber");
  console.error(`[DIAG] ${label} columns (${rows.length} rows):`, cols.slice(0, 20).join(" | "));
  const sample = rows[0];
  const vals = cols.slice(0, 10).map((c) => `${c}=${String(sample[c]).slice(0, 30)}`);
  console.error(`[DIAG] ${label} row[0]:`, vals.join(", "));
}

// 대학알리미 대학별 외국인유학생수 CSV → 대학별 집계(최신연도, 상위 30).
// 실제 컬럼이 성별,국적명,체류자격,학교명 처럼 count 컬럼이 없으면 행 수를 학생 수로 추정.
// 고등교육기관(대학)명 패턴 — 학생단위 레코드의 자기기재 학교명에서 비대학(어학원·기업·공란 등) 노이즈 제거.
const UNIV_NAME_RE = /대학|과학기술원|KAIST|UNIST|GIST|DGIST|POSTECH|포스텍|폴리텍|사이버대|방송통신대|한국기술교육|예술종합학교/i;

function transformAcademyUniversities(rows, baseYear = null) {
  if (!rows.length) return { latestYear: null, universities: [], universityCount: 0, totalForeignStudents: 0 };
  logColumnDiag("academyinfo", rows);

  const headers = Object.keys(rows[0]).filter((k) => k !== "__rowNumber");
  const hasCountCol = headers.some((h) =>
    ["외국인유학생수", "유학생수", "외국인학생수", "외국인재학생수"].some((c) => h.includes(c))
  );

  const yearOf = (r) => toNumber(firstValue(r, ["기준연도", "학년도", "연도", "년도", "년"]));
  const years = rows.map(yearOf).filter((y) => y >= 2000 && y <= 2100);
  const latestYear = years.length ? Math.max(...years) : baseYear;
  const agg = new Map();
  for (const r of rows) {
    if (years.length && yearOf(r) && yearOf(r) !== Math.max(...years)) continue;
    const uni = String(firstValue(r, ["대학명", "학교명", "기관명", "대학", "학교"])).trim();
    if (!uni || /합계|소계|총계|전체/.test(uni)) continue;
    // 학생단위 레코드(연도·카운트 컬럼 없음)일 때만 대학명 필터 적용 — 자기기재 비대학 노이즈 제거.
    if (!hasCountCol && !UNIV_NAME_RE.test(uni)) continue;
    const campus = String(firstValue(r, ["캠퍼스", "분교", "캠퍼스명"])).trim();
    const foreign = hasCountCol
      ? toNumber(firstValue(r, ["외국인유학생수", "외국인유학생", "유학생수", "유학생", "외국인학생수", "외국인학생", "외국인재학생수"]))
      : 1;
    const total = hasCountCol ? toNumber(firstValue(r, ["전체학생수", "재학생수", "총학생수", "재적학생수", "전체재학생수"])) : 0;
    const key = uni + (campus ? `||${campus}` : "");
    const cur = agg.get(key) ?? { university: uni, campus, foreignStudents: 0, totalStudents: 0 };
    cur.foreignStudents += foreign;
    cur.totalStudents += total;
    agg.set(key, cur);
  }
  const list = [...agg.values()].filter((u) => u.foreignStudents > 0);
  if (!list.length) {
    console.error("[DIAG] academyinfo: no records matched. yearOf sample:", years.slice(0, 5));
  }
  list.sort((a, b) => b.foreignStudents - a.foreignStudents);
  return {
    latestYear,
    universities: list.slice(0, 30).map((u, i) => ({
      rank: i + 1,
      university: u.university,
      campus: u.campus || null,
      sido: null,
      foreignStudents: u.foreignStudents,
      foreignShare: u.totalStudents > 0 ? Number(((u.foreignStudents / u.totalStudents) * 100).toFixed(1)) : null
    })),
    universityCount: list.length,
    totalForeignStudents: list.reduce((s, u) => s + u.foreignStudents, 0)
  };
}

// 행안부 시군구 외국인주민 현황 CSV → 시군구별 집계(최신연도, 상위 N).
// 기대 컬럼: 기준연도, 시도, 시군구, 외국인주민수, ...
function transformRegionResidents(rows) {
  if (!rows.length) return { latestYear: null, regions: [], regionCount: 0, totalResidents: 0 };
  logColumnDiag("mois_region", rows);

  const yearOf = (r) => toNumber(firstValue(r, ["기준연도", "연도", "년도", "년", "기준년도"]));
  const years = rows.map(yearOf).filter((y) => y >= 2000 && y <= 2100);
  const latestYear = years.length ? Math.max(...years) : null;
  const out = [];
  for (const r of rows) {
    if (latestYear && yearOf(r) && yearOf(r) !== latestYear) continue;
    const sido = String(firstValue(r, ["시도", "시·도", "행정구역", "시도명"])).trim();
    const sigungu = String(firstValue(r, ["시군구", "시·군·구", "시군구명"])).trim();
    const count = toNumber(firstValue(r, ["외국인주민수", "외국인주민", "외국인수", "총계", "계", "합계", "외국인주민수(계)"]));
    // 시군구 단위 행만 사용(시도 합계·전국 합계 행 제외)해 중복/혼선 방지.
    if (!sido || !sigungu || count <= 0) continue;
    if (/합계|소계|총계|전국|계$/.test(sigungu) || sigungu === sido) continue;
    out.push({ sido, sigungu, count });
  }
  if (!out.length) {
    console.error("[DIAG] mois_region: no records matched. years:", years.slice(0, 5));
  }
  out.sort((a, b) => b.count - a.count);
  return {
    latestYear,
    regions: out.slice(0, 50),
    regionCount: out.length,
    totalResidents: out.reduce((s, r) => s + r.count, 0)
  };
}

// 교육부 외국인 유학생 현황(최신) CSV: 시도,설립구분,학교명,연도,남,여,계
function transformMoeStudentsBySchool(rows) {
  if (!rows.length) return { latestYear: null, universities: [], universityCount: 0, totalForeignStudents: 0 };

  const yearOf = (r) => toNumber(firstValue(r, ["연도", "학년도", "기준연도", "년도"]));
  const years = rows.map(yearOf).filter((y) => y >= 2000 && y <= 2100);
  const latestYear = years.length ? Math.max(...years) : null;

  const agg = new Map();
  for (const r of rows) {
    const yr = yearOf(r);
    if (latestYear && yr && yr !== latestYear) continue;
    const uni = String(firstValue(r, ["학교명", "대학명", "기관명"])).trim();
    if (!uni || /합계|소계|총계|전체/.test(uni)) continue;
    const sido = String(firstValue(r, ["시도", "지역", "시·도"])).trim();
    const total = toNumber(firstValue(r, ["계", "합계", "총계"]));
    const male = toNumber(firstValue(r, ["남", "남자", "남학생"]));
    const female = toNumber(firstValue(r, ["여", "여자", "여학생"]));
    const count = total || male + female;

    const cur = agg.get(uni) ?? { university: uni, sido, foreignStudents: 0 };
    cur.foreignStudents += count;
    agg.set(uni, cur);
  }

  const list = [...agg.values()].filter((u) => u.foreignStudents > 0);
  list.sort((a, b) => b.foreignStudents - a.foreignStudents);
  return {
    latestYear,
    universities: list.slice(0, 30).map((u, i) => ({
      rank: i + 1,
      university: u.university,
      campus: null,
      sido: u.sido || null,
      foreignStudents: u.foreignStudents,
      foreignShare: null
    })),
    universityCount: list.length,
    totalForeignStudents: list.reduce((s, u) => s + u.foreignStudents, 0)
  };
}

// 행안부 국적×연령대 현황 CSV: 국적,연령대,값,데이터기준일자
function transformNationalityByAge(rows) {
  if (!rows.length) return { ageGroups: [], nationalities: [], items: [] };

  const natAgeMap = new Map();
  const ageGroupSet = new Set();

  for (const r of rows) {
    const nationality = String(firstValue(r, ["국적", "국가", "국적명"])).trim();
    const ageGroup = String(firstValue(r, ["연령대", "연령", "나이"])).trim();
    const value = toNumber(firstValue(r, ["값", "인원", "수", "계", "합계"]));
    if (!nationality || !ageGroup || value <= 0) continue;
    const key = `${nationality}||${ageGroup}`;
    natAgeMap.set(key, (natAgeMap.get(key) ?? 0) + value);
    ageGroupSet.add(ageGroup);
  }

  const ageGroups = [...ageGroupSet].sort();

  const natTotals = new Map();
  for (const [key, count] of natAgeMap.entries()) {
    const nat = key.split("||")[0];
    natTotals.set(nat, (natTotals.get(nat) ?? 0) + count);
  }
  const nationalities = [...natTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nationality, total]) => ({ nationality, total }));

  const items = [...natAgeMap.entries()].map(([key, count]) => {
    const [nationality, ageGroup] = key.split("||");
    return { nationality, ageGroup, count };
  });

  return { ageGroups, nationalities, items };
}

// 국민건강보험공단 외국인 건강보험 적용인구 CSV (지역별)
// 실제 컬럼: 구분, 직장(재외국민 가입자), 직장(재외국민 피부양자),
//            직장(외국인 가입자), 직장(외국인 피부양자),
//            지역(재외국민 가입자), 지역(재외국민 세대수),
//            지역(외국인 가입자), 지역(외국인 세대수)
function transformHealthInsurance(rows) {
  if (!rows.length) return [];
  logColumnDiag("nhis_coverage", rows);
  return rows
    .map((r) => {
      const region = String(firstValue(r, ["구분", "시도", "지역명"])).trim();
      // 외국인만: "외국인 가입자" 포함 컬럼을 정확히 매핑 (재외국민 컬럼보다 뒤에 있음)
      const workplace = toNumber(
        (() => {
          for (const [k, v] of Object.entries(r)) {
            const c = k.replace(/\s/g, "");
            if (c.includes("직장") && c.includes("외국인") && c.includes("가입자")) return v;
          }
          return 0;
        })()
      );
      const regional = toNumber(
        (() => {
          for (const [k, v] of Object.entries(r)) {
            const c = k.replace(/\s/g, "");
            if (c.includes("지역") && c.includes("외국인") && c.includes("가입자")) return v;
          }
          return 0;
        })()
      );
      const total = workplace + regional;
      return { region, workplace, regional, total };
    })
    .filter((r) => r.region && r.total > 0);
}

// 여성가족부 다문화가족 현황 CSV (구군별)
// 실제 컬럼: 구군명, 총계, 총계(남), 총계(여), 결혼이민자, 결혼이민자(남), 결혼이민자(여),
//            결혼이민자_국적미취득자, ..., 자녀, 자녀(남), 자녀(여)
function transformMulticulturalFamily(rows) {
  if (!rows.length) return { items: [], totalCount: 0 };
  logColumnDiag("mogef_multicultural", rows);

  const items = rows
    .map((r) => {
      const region = String(
        firstValue(r, ["구군명", "시군구명", "지역명", "유형", "구분", "시도", "지역", "가족유형"])
      ).trim();
      const total = toNumber(firstValue(r, ["총계", "합계", "계", "인원수", "인원"]));
      const marriage = toNumber(firstValue(r, ["결혼이민자"]));
      const children = toNumber(firstValue(r, ["자녀"]));
      return { region, total, marriage, children };
    })
    .filter((r) => r.region && r.total > 0);

  return {
    items,
    totalCount: items.reduce((s, r) => s + r.total, 0),
    latestYear: null
  };
}

// 대학알리미 고등교육기관 기본현황 CSV: 번호,상태,상호명,대표자명,기관구분,지역,주소,...
function transformUniversityStats(rows) {
  if (!rows.length) return [];
  logColumnDiag("academyinfo_stats", rows);
  return rows
    .map((r) => {
      const name = String(firstValue(r, ["상호명", "대학명", "학교명", "기관명"])).trim();
      const type = String(firstValue(r, ["기관구분", "학교구분", "구분"])).trim();
      const region = String(firstValue(r, ["지역", "시도", "소재지", "주소지"])).trim();
      return { name, type, region };
    })
    .filter((r) => r.name);
}

async function readLatestRaw(prefix) {
  const files = await readdir(rawDir).catch(() => []);
  const target = files
    .filter((file) => file.startsWith(prefix) && file.endsWith(".csv"))
    .sort()
    .at(-1);
  if (!target) return null;
  const path = join(rawDir, target);
  return { path, text: decodeCsv(await readFile(path)) };
}

// 경제활동 시계열 파서: nationality 없는 KOSIS 집계 (취업자·실업자·비경활 등).
// mapping: { period: "PRD_DE", segment: "C1_NM", value: "DT" }
function transformKosisEconActivity(rows, mapping) {
  return rows
    .map((row) => ({
      period: String(pickField(row, mapping.period) || "").trim(),
      category: String(pickField(row, mapping.segment) || "").trim(),
      value: toNumber(pickField(row, mapping.value))
    }))
    .filter((r) => r.period && r.category && r.value > 0);
}

// ── API(JSON) 소스 파서 ─────────────────────────────────────────────────────────
// KOSIS / data.go.kr REST 응답을 타입 모델로 변환한다. 필드명은 data_sources.mjs 의
// responseMapping 으로 조정 가능하다 (단일 문자열 또는 후보 배열 모두 허용).

async function readLatestRawJson(prefix) {
  const files = await readdir(rawDir).catch(() => []);
  const target = files.filter((f) => f.startsWith(prefix) && f.endsWith(".json")).sort().at(-1);
  if (!target) return null;
  try {
    const rows = JSON.parse(await readFile(join(rawDir, target), "utf8"));
    return { file: target, rows: Array.isArray(rows) ? rows : [] };
  } catch {
    return null;
  }
}

// mapping 값이 배열이면 후보 키 중 첫 매칭, 문자열이면 정확 키.
function pickField(row, mapping) {
  if (!mapping) return "";
  const keys = Array.isArray(mapping) ? mapping : [mapping];
  for (const key of keys) {
    if (row[key] != null && row[key] !== "") return row[key];
    // 공백 제거 부분 일치 (한글 컬럼명 변형 대응)
    const compactMatch = Object.keys(row).find(
      (k) => k.replace(/\s/g, "") === String(key).replace(/\s/g, "")
    );
    if (compactMatch && row[compactMatch] !== "") return row[compactMatch];
  }
  return "";
}

function periodToMonth(period) {
  const p = String(period ?? "").trim();
  if (/^\d{6}$/.test(p)) return `${p.slice(0, 4)}-${p.slice(4, 6)}-01`;
  if (/^\d{4}$/.test(p)) return `${p}-12-01`;
  return "2024-12-01";
}

function transformKosisStatus(rows, mapping, source) {
  return rows
    .map((row, index) => {
      const nationality = String(pickField(row, mapping.nationality) || "").trim();
      const segmentRaw = String(pickField(row, mapping.segment) || "").trim();
      const residentCount = toNumber(pickField(row, mapping.value));
      const segmentType = inferSegment(segmentRaw, segmentRaw);
      return {
        id: `${source.id}-${index + 1}`,
        baseYear: Number(String(pickField(row, mapping.period)).slice(0, 4)) || 2024,
        nationality,
        visaCode: "",
        visaName: segmentRaw,
        segmentType,
        residentCount,
        financialNeedTags: needsForSegment(segmentType),
        sourceName: `${source.provider} ${source.title}`,
        sourceUrl: source.sourceUrl
      };
    })
    .filter((r) => r.nationality && r.residentCount > 0);
}

function transformRegionRows(rows, mapping, source) {
  return rows
    .map((row, index) => {
      const sido = String(pickField(row, mapping.sido ?? mapping.region) || "").trim();
      const sigungu = String(pickField(row, mapping.sigungu) || "전체").trim() || "전체";
      const residentCount = toNumber(pickField(row, mapping.value));
      return {
        id: `${source.id}-${index + 1}`,
        baseMonth: periodToMonth(pickField(row, mapping.period)),
        sido,
        sigungu,
        nationality: "전체",
        gender: "전체",
        residentCount,
        longTermCount: residentCount,
        shortTermCount: 0,
        yoyChangeRate: 0,
        momChangeRate: 0,
        sourceName: `${source.provider} ${source.title}`
      };
    })
    .filter((r) => r.sido && r.residentCount > 0);
}

// API JSON 소스를 읽어 보조 데이터 모델로 변환 (MOJ 1차 데이터는 건드리지 않음).
async function buildApiSources() {
  const apiStatus = [];
  const apiRegion = [];
  const apiEconActivity = [];
  const parsedFiles = [];

  for (const source of publicDataSources) {
    if (source.type !== "kosis" && source.type !== "openapi") continue;
    const mapping = source.responseMapping;
    if (!mapping) continue;
    const raw = await readLatestRawJson(source.outputBaseName);
    if (!raw || raw.rows.length === 0) continue;

    let produced = 0;
    if (source.targetTable === "foreign_resident_status" && mapping.nationality) {
      const rows = transformKosisStatus(raw.rows, mapping, source);
      apiStatus.push(...rows);
      produced = rows.length;
    } else if (source.targetTable === "foreign_resident_status" && !mapping.nationality) {
      // nationality 없는 집계(경제활동 등)는 시계열로 수집
      const rows = transformKosisEconActivity(raw.rows, mapping);
      apiEconActivity.push(...rows.map((r) => ({ ...r, sourceId: source.id, provider: source.provider, title: source.title })));
      produced = rows.length;
    } else {
      const rows = transformRegionRows(raw.rows, mapping, source);
      apiRegion.push(...rows);
      produced = rows.length;
    }
    parsedFiles.push({ source: source.id, file: raw.file, produced });
  }

  return { apiStatus, apiRegion, apiEconActivity, parsedFiles };
}

// ── KOSIS 분류형 시계열 전용 파서 (외국인 금융/소득·EPS 도입·유학생 국적/학위) ──────────
// 신규 KOSIS 소스는 PRD_DE(연도)·C1~C3_NM(분류)·ITM_NM(항목)·DT(값) 구조라 제네릭 버킷이 아닌
// 소스별 전용 집계로 차트용 export를 만든다.
const KOSIS_TOTAL_LABELS = ["합계", "총계", "계", "전체", "소계"];
function readKosisDimRows(rows) {
  // 분류 키(연도+C1~C3+ITM)로 중복 제거 — 일부 KOSIS 표가 동일 셀을 2회 반환한다.
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const o = {
      year: Number(String(r.PRD_DE ?? "").slice(0, 4)) || null,
      c1: String(r.C1_NM ?? "").trim(),
      c2: String(r.C2_NM ?? "").trim(),
      c3: String(r.C3_NM ?? "").trim(),
      itm: String(r.ITM_NM ?? "").trim(),
      value: toNumber(r.DT),
      unit: String(r.UNIT_NM ?? "").trim()
    };
    const key = `${o.year}|${o.c1}|${o.c2}|${o.c3}|${o.itm}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(o);
  }
  return out;
}
function maxYearOf(rows) {
  const ys = rows.map((r) => r.year).filter(Boolean);
  return ys.length ? Math.max(...ys) : null;
}
// 임금/고용계약: c1=대상(외국인/이민자/귀화), c2=특성(계 등), itm=구간. 외국인·계의 구간 분포 + 합계 추세.
function buildBandDist(raw, targetC1) {
  const rows = readKosisDimRows(raw).filter((r) => r.c1 === targetC1 && r.c2 === "계");
  const ly = maxYearOf(rows);
  const distribution = rows
    .filter((r) => r.year === ly && !KOSIS_TOTAL_LABELS.includes(r.itm) && r.value > 0)
    .map((r) => ({ band: r.itm, value: r.value }));
  const trend = rows
    .filter((r) => r.itm === "합계" && r.value > 0)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ year: r.year, value: r.value }));
  return { latestYear: ly, unit: rows[0]?.unit ?? "", distribution, trend };
}
// EPS 도입: c1=국가 또는 업종, itm=도입현황. 국가별(합계 제외)·업종별 분포 + 합계 연도 추세.
function buildEps(rawCountry, rawIndustry) {
  const c = readKosisDimRows(rawCountry);
  const ly = maxYearOf(c);
  const byCountry = c
    .filter((r) => r.year === ly && !KOSIS_TOTAL_LABELS.includes(r.c1) && r.value > 0)
    .map((r) => ({ country: r.c1, value: r.value }))
    .sort((a, b) => b.value - a.value);
  const trend = c
    .filter((r) => KOSIS_TOTAL_LABELS.includes(r.c1) && r.value > 0)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ year: r.year, value: r.value }));
  const ind = readKosisDimRows(rawIndustry);
  const ily = maxYearOf(ind);
  const byIndustry = ind
    .filter((r) => r.year === ily && !KOSIS_TOTAL_LABELS.includes(r.c1) && r.value > 0)
    .map((r) => ({ industry: r.c1, value: r.value }))
    .sort((a, b) => b.value - a.value);
  return { latestYear: ly, unit: c[0]?.unit ?? "명", byCountry, byIndustry, trend };
}
// 유학생 국적/학위 (DT_1B040A14): c1=국적, c2=성별, c3=학위과정. c2=계 기준 국적별 top + 학위과정 분포.
function buildStudentNationality(raw) {
  const rows = readKosisDimRows(raw).filter((r) => r.c2 === "계");
  const ly = maxYearOf(rows);
  // 대륙 집계(아시아주계 등 '주계')·총계·기타계는 국가가 아니므로 제외.
  const isNatAgg = (s) => /주계$/.test(s) || ["총계", "기타계", "합계", "계", "전체"].includes(s);
  const byNationality = rows
    .filter((r) => r.year === ly && r.c3 === "합계" && !isNatAgg(r.c1) && r.value > 0)
    .map((r) => ({ nationality: r.c1, value: r.value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
  const totalNat = rows.filter((r) => r.year === ly && KOSIS_TOTAL_LABELS.includes(r.c1));
  const degSrc = totalNat.length ? totalNat : rows.filter((r) => r.year === ly && !KOSIS_TOTAL_LABELS.includes(r.c1));
  const degMap = new Map();
  for (const r of degSrc) {
    if (!r.c3 || KOSIS_TOTAL_LABELS.includes(r.c3) || r.value <= 0) continue;
    degMap.set(r.c3, (degMap.get(r.c3) ?? 0) + r.value);
  }
  const byDegree = [...degMap.entries()].map(([degree, value]) => ({ degree, value })).sort((a, b) => b.value - a.value);
  return { latestYear: ly, byNationality, byDegree };
}
// KEDI 고등교육 (DT_1963003_010_S): c1=시도, c2=학위/학교현황. 시도별 합산 + 학위별(시도=총계).
function buildKediRegion(raw) {
  const rows = readKosisDimRows(raw);
  const ly = maxYearOf(rows);
  // C2(학교현황)는 재적학생·교원 등 11종이 섞여 있다 → '외국인 학생수(학위과정)' 항목만 사용.
  const FOREIGN_C2 = "외국인 학생수(학위과정)";
  const byRegion = rows
    .filter((r) => r.year === ly && r.c2 === FOREIGN_C2 && !KOSIS_TOTAL_LABELS.includes(r.c1) && r.value > 0)
    .map((r) => ({ region: r.c1, value: r.value }))
    .sort((a, b) => b.value - a.value);
  return { latestYear: ly, byRegion };
}
// ITM 계층 표기('- 상용근로자','· 취업자' 등)에서 들여쓰기·기호 제거.
const cleanItm = (s) => String(s ?? "").replace(/^[\s·\-]+/, "").replace(/\s+/g, " ").trim();
// 종사상지위 (DT_2FB007F): c1=대상, c2=성별, itm=종사상지위. 외국인·계 기준 종사상지위 leaf 분포 + 합계 추세.
function buildEmploymentStatus(raw, targetC1 = "외국인") {
  const rows = readKosisDimRows(raw).filter((r) => r.c1 === targetC1 && r.c2 === "계");
  const ly = maxYearOf(rows);
  // 집계(합계/임금근로자/비임금근로자)는 leaf의 상위 → 분포에서 제외, leaf 5종만.
  const AGG = new Set(["합계", "임금근로자", "비임금근로자"]);
  const distribution = rows
    .filter((r) => r.year === ly && !AGG.has(cleanItm(r.itm)) && r.value > 0)
    .map((r) => ({ status: cleanItm(r.itm), value: r.value }));
  const wageWorkers = rows.find((r) => r.year === ly && cleanItm(r.itm) === "임금근로자")?.value ?? null;
  const regular = rows.find((r) => r.year === ly && cleanItm(r.itm) === "상용근로자")?.value ?? null;
  const total = rows.find((r) => r.year === ly && cleanItm(r.itm) === "합계")?.value ?? null;
  const trend = rows
    .filter((r) => cleanItm(r.itm) === "합계" && r.value > 0)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ year: r.year, value: r.value }));
  // 상용근로자 비중(안정 급여소득 대리지표): 전체 취업자 대비.
  const regularShare = regular != null && total ? Math.round((regular / total) * 1000) / 10 : null;
  return { latestYear: ly, unit: rows[0]?.unit ?? "명", distribution, trend, wageWorkers, regular, total, regularShare };
}
// 산업별 취업 (DT_2FB021F): c1=대상, c2=성별, itm=산업. 외국인·계 기준 산업 분포(소계 제외) + 합계 추세.
function buildIndustryEmployment(raw, targetC1 = "외국인") {
  const rows = readKosisDimRows(raw).filter((r) => r.c1 === targetC1 && r.c2 === "계");
  const ly = maxYearOf(rows);
  // '취업자 합계'(총계)·'제조업'(광업·제조업의 하위 중복)은 제외, 대분류 산업만.
  const SKIP = new Set(["취업자 합계", "제조업"]);
  const distribution = rows
    .filter((r) => r.year === ly && !SKIP.has(cleanItm(r.itm)) && r.value > 0)
    .map((r) => ({ industry: cleanItm(r.itm), value: r.value }))
    .sort((a, b) => b.value - a.value);
  const trend = rows
    .filter((r) => cleanItm(r.itm) === "취업자 합계" && r.value > 0)
    .sort((a, b) => a.year - b.year)
    .map((r) => ({ year: r.year, value: r.value }));
  return { latestYear: ly, unit: rows[0]?.unit ?? "명", distribution, trend };
}
// 연령계층별 경제활동 (DT_2FA005F): c1=대상, c2=연령, itm=경활지표. 외국인 기준 연령대별 취업자·참가율·고용률.
function buildAgeActivity(raw, targetC1 = "외국인") {
  const rows = readKosisDimRows(raw).filter((r) => r.c1 === targetC1 && r.c2 !== "계");
  const ly = maxYearOf(rows);
  const ageBands = [...new Set(rows.filter((r) => r.year === ly).map((r) => r.c2))];
  const distribution = ageBands.map((band) => {
    const at = (label) => rows.find((r) => r.year === ly && r.c2 === band && cleanItm(r.itm) === label)?.value ?? null;
    return {
      ageBand: band,
      employed: at("취업자"),
      economicallyActive: at("경제활동인구"),
      participationRate: at("경제활동참가율"),
      employmentRate: at("고용률")
    };
  }).filter((d) => d.employed != null || d.economicallyActive != null);
  return { latestYear: ly, unit: rows[0]?.unit ?? "명", distribution };
}

// ── 한국은행 ECOS: 이전소득수지(본국송금 대리)·환율 ──────────────────────────────
function readEcosRows(raw) {
  return (raw ?? []).map((r) => ({
    item1: String(r.ITEM_CODE1 ?? ""),
    name1: String(r.ITEM_NAME1 ?? ""),
    time: String(r.TIME ?? ""),
    value: toNumber(r.DATA_VALUE),
    unit: String(r.UNIT_NAME ?? "")
  }));
}
// 국제수지(301Y013)에서 이전소득수지(ITEM_CODE1=4B1000)만 추출 → 연도/월 추세.
function buildBopTransferIncome(annualRaw, monthlyRaw) {
  const A = readEcosRows(annualRaw).filter((r) => r.item1 === "4B1000" && r.value !== null);
  const annual = A
    .map((r) => ({ year: Number(r.time.slice(0, 4)), value: r.value }))
    .filter((r) => r.year >= 2000)
    .sort((a, b) => a.year - b.year);
  const M = readEcosRows(monthlyRaw).filter((r) => r.item1 === "4B1000" && r.value !== null);
  const monthly = M
    .map((r) => ({ month: `${r.time.slice(0, 4)}-${r.time.slice(4, 6)}`, value: r.value }))
    .filter((r) => r.month.length === 7)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-36);
  const latest = annual.at(-1) ?? null;
  return {
    unit: A[0]?.unit ?? "백만달러",
    latestYear: latest?.year ?? null,
    latestValue: latest?.value ?? null,
    annual,
    monthly
  };
}
// 주요국 대원화 환율(731Y001) → 주요 통화 월말 시계열(최근 24개월) + 최신값.
function buildExchangeRate(dailyRaw) {
  const CUR = { usd: "0000001", cny: "0000053", jpy: "0000002", eur: "0000003" };
  const rows = readEcosRows(dailyRaw);
  const monthEnd = {};
  const latest = {};
  for (const [k, code] of Object.entries(CUR)) {
    const days = rows.filter((r) => r.item1 === code && r.value !== null).sort((a, b) => a.time.localeCompare(b.time));
    const mm = new Map();
    for (const d of days) mm.set(`${d.time.slice(0, 4)}-${d.time.slice(4, 6)}`, d.value); // 오름차순 → 마지막 = 월말
    monthEnd[k] = mm;
    const last = days.at(-1) ?? null;
    latest[k] = last ? { date: last.time, value: last.value } : null;
  }
  const allMonths = [...new Set(Object.values(monthEnd).flatMap((m) => [...m.keys()]))].sort().slice(-24);
  const monthly = allMonths.map((month) => {
    const o = { month };
    for (const k of Object.keys(CUR)) o[k] = monthEnd[k].get(month) ?? null;
    return o;
  });
  return { latest, monthly };
}

// ── 데이터 품질 가드: 시계열 비정상 급락 탐지 ───────────────────────────────────
// 단일 기간/항목이 직전 대비 dropPct% 이상 급락하면 손상·집계기준 변동 의심으로 플래그.
// (예: 유학생 추이 2024 행이 D-2 절반으로 손상돼 total -24.7% 급락한 사례를 잡아낸다.
//  참고: COVID 2020 유학생 -14.9%는 정상이므로 dropPct 기본 20%는 이를 오탐하지 않는다.)
function detectTrendAnomalies(series, { valueKey = "value", dropPct = 20, label = "series", periodKey = "year" } = {}) {
  const out = [];
  const sorted = [...(series ?? [])]
    .filter((r) => r && typeof r[valueKey] === "number" && Number.isFinite(r[valueKey]))
    .sort((a, b) => a[periodKey] - b[periodKey]);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1][valueKey];
    const cur = sorted[i][valueKey];
    if (prev > 0) {
      const chg = ((cur - prev) / prev) * 100;
      if (chg <= -dropPct) {
        out.push({
          series: label,
          field: valueKey,
          period: sorted[i][periodKey],
          prevPeriod: sorted[i - 1][periodKey],
          changePct: Number(chg.toFixed(1)),
          message: `${label} ${sorted[i][periodKey]} '${valueKey}' ${chg.toFixed(1)}% (vs ${sorted[i - 1][periodKey]}) — 비정상 급락(데이터 손상/집계기준 변동 의심)`
        });
      }
    }
  }
  return out;
}

// 수집 이력(catalog)을 앱이 읽는 커밋 대상 TS 파일로 변환한다.
// 파일이 git에 커밋되므로 git 이력으로 일자별 수집 이력이 영구 보존된다.
async function buildLineage() {
  let catalog = null;
  try {
    catalog = JSON.parse(await readFile(join(catalogDir, "latest_fetch_catalog.json"), "utf8"));
  } catch {
    catalog = null;
  }

  const entries = (catalog?.sources ?? []).map((s) => ({
    id: s.id,
    provider: s.provider,
    title: s.title,
    category: s.category ?? null,
    type: s.type,
    targetTable: s.targetTable ?? null,
    sourceUrl: s.sourceUrl ?? null,
    license: s.license ?? null,
    updateCycle: s.updateCycle ?? null,
    personalDataSafe: s.personalDataSafe ?? null,
    verified: s.verified ?? null,
    notes: s.notes ?? null,
    fetchedAt: s.fetchedAt ?? null,
    status: s.result?.status ?? "unknown",
    rowCount: s.result?.rowCount ?? null,
    savedFile: s.result?.savedFile ?? s.result?.cachedRawFile ?? null,
    requestUrls: s.result?.requestUrls ?? [],
    reason: s.result?.reason ?? null
  }));

  const discovery = (catalog?.discovery ?? []).map((d) => ({
    id: d.id,
    provider: d.provider,
    keyword: d.keyword,
    purpose: d.purpose,
    status: d.status,
    foundCount: d.foundCount ?? (d.links?.length ?? 0),
    links: (d.links ?? []).map((l) => ({
      datasetId: l.datasetId,
      kind: l.kind,
      url: l.url
    }))
  }));

  // 각 소스를 정확히 하나의 버킷으로 분류 (상호배타적).
  function classify(status) {
    const s = String(status);
    if (s === "downloaded") return "downloaded";
    if (s.includes("cached")) return "cached";
    if (s === "skipped_no_key") return "skippedNoKey";
    return "failed";
  }

  // last-good lineage carry-forward: 이번 수집은 실패했지만 직전에 성공(데이터 보존)한 소스는
  // '실패'가 아니라 'cached(캐시 사용)'로 표기한다. CI가 클라우드 IP 차단으로 매번 수집 실패해도
  // realData는 last-good로 보존되므로, 데이터가 멀쩡한데 화면이 '실패 N'으로 과장 표시되는 것을 막는다.
  const prevLineageText = await readFile(join(generatedDir, "dataLineage.ts"), "utf8").catch(() => "");
  const prevLineage = extractPrevExport(prevLineageText, "dataLineage");
  const prevById = new Map((prevLineage?.sources ?? []).map((e) => [e.id, e]));
  for (const e of entries) {
    if (classify(e.status) !== "failed") continue;
    const prev = prevById.get(e.id);
    const prevOk = prev && (prev.status === "downloaded" || String(prev.status).includes("cached")) && (prev.rowCount ?? 0) > 0;
    if (prevOk) {
      e.reason = `이번 수집 실패(${e.status}${e.reason ? ": " + e.reason : ""}) — 직전 수집값 유지`;
      e.status = "cached";
      e.rowCount = prev.rowCount;
      e.savedFile = prev.savedFile ?? e.savedFile;
      e.fetchedAt = e.fetchedAt ?? prev.fetchedAt ?? null;
    }
  }

  const buckets = { downloaded: 0, cached: 0, skippedNoKey: 0, failed: 0 };
  for (const e of entries) buckets[classify(e.status)] += 1;

  const lineage = {
    generatedAt: catalog?.generatedAt ?? new Date().toISOString(),
    keysPresent: catalog?.keysPresent ?? { DATA_GO_KR_SERVICE_KEY: false, KOSIS_API_KEY: false },
    totals: { sources: entries.length, ...buckets },
    sources: entries,
    discovery
  };

  const content =
    `// Auto-generated by scripts/build_real_data.mjs. Do not edit by hand.\n` +
    `// 외국인 데이터 수집 출처·이력(lineage). git 이력으로 일자별 수집 기록이 보존됩니다.\n\n` +
    `export type DataLineageSource = {\n` +
    `  id: string;\n  provider: string;\n  title: string;\n  category: string | null;\n` +
    `  type: string;\n  targetTable: string | null;\n  sourceUrl: string | null;\n` +
    `  license: string | null;\n  updateCycle: string | null;\n  personalDataSafe: boolean | null;\n` +
    `  verified: boolean | null;\n  notes: string | null;\n  fetchedAt: string | null;\n` +
    `  status: string;\n  rowCount: number | null;\n  savedFile: string | null;\n` +
    `  requestUrls: string[];\n  reason: string | null;\n};\n\n` +
    `export type DataLineageDiscoveryLink = {\n` +
    `  datasetId: string;\n  kind: string;\n  url: string;\n};\n\n` +
    `export type DataLineageDiscovery = {\n` +
    `  id: string;\n  provider: string;\n  keyword: string;\n  purpose: string;\n` +
    `  status: string;\n  foundCount: number;\n  links: DataLineageDiscoveryLink[];\n};\n\n` +
    `export type DataLineage = {\n` +
    `  generatedAt: string;\n` +
    `  keysPresent: Record<string, boolean>;\n` +
    `  totals: { sources: number; downloaded: number; cached: number; skippedNoKey: number; failed: number };\n` +
    `  sources: DataLineageSource[];\n  discovery: DataLineageDiscovery[];\n};\n\n` +
    `export const dataLineage: DataLineage = ${JSON.stringify(lineage, null, 2)};\n`;

  await writeFile(join(generatedDir, "dataLineage.ts"), content, "utf8");
  return lineage.totals;
}

async function main() {
  await ensureDir(processedDir);
  await ensureDir(generatedDir);

  // 법무부 체류외국인 국적별 현황 (전체, 단기+장기 포함) — 국적 분포 집계
  const statusRaw = await readLatestRaw("moj_foreign_resident_status_2024");
  let statusRows = [];
  let nationalityDistribution = [];
  let allVisaSegments = [];
  if (statusRaw) {
    const parsed = parseCsv(statusRaw.text);
    statusRows = transformStatus(parsed);
    const agg = aggregateStatusWide(parsed, "법무부 체류외국인 국적 및 체류자격별 현황", "https://www.data.go.kr/data/3045188/fileData.do");
    nationalityDistribution = agg.nationals;
    allVisaSegments = agg.visaSegments;
  }

  const regionRows = summarizeStatus(statusRows).slice(0, 200);

  // 법무부 외국인체류데이터 (장기체류 중심) — 비자/세그먼트 분포 집계
  const stayRaw = await readLatestRaw("moj_foreign_stay_data_2024");
  let stayVisaSegments = [];
  let stayVisaTypes = [];
  if (stayRaw) {
    const parsed = parseCsv(stayRaw.text);
    const agg = aggregateStatusWide(parsed, "법무부 외국인체류데이터", "https://www.data.go.kr/data/3069963/fileData.do");
    stayVisaSegments = agg.visaSegments;
    stayVisaTypes = agg.visaTypes;
  }
  // 장기체류 세그먼트가 있으면 이쪽을 우선 사용 (금융 활용도 높은 장기 체류자 기준)
  const visaDistribution = stayVisaSegments.length > 0 ? stayVisaSegments : allVisaSegments;

  // 유학생 체류현황(법무부 연도별 외국인 유학생). 연도×체류자격 집계.
  // 유학생 추이: 월별표(15100039=moe_foreign_student_region, 정확·최신 2022~2026.4)를 1차로.
  // 연도말 단독표(15100038=moj_foreign_student_stay)는 2024 행 손상(D-2 절반)·2024 고정 → 폴백으로만.
  const studentMonthlyRaw = await readLatestRaw("moe_foreign_student_region");
  const studentRaw = await readLatestRaw("moj_foreign_student_stay");
  let studentByYear = [];
  let studentByVisa = [];
  let studentSummary = { hasData: false, latestYear: null, total: 0, degree: 0, language: 0, yoy: 0 };
  const monthlyAgg = studentMonthlyRaw ? summarizeStudentsMonthly(parseCsv(studentMonthlyRaw.text)) : null;
  if (monthlyAgg) {
    studentByYear = monthlyAgg.yearSeries;
    studentByVisa = monthlyAgg.byVisa;
    studentSummary = monthlyAgg.summary;
  } else if (studentRaw) {
    const agg = summarizeStudents(transformStudentStay(parseCsv(studentRaw.text)));
    studentByYear = agg.yearSeries;
    studentByVisa = agg.byVisa;
    studentSummary = agg.summary;
  }

  // 법무부 출입국 통계월보 (동일 wide 포맷, 가장 최근 월 기준) — 더 최신이면 nationalityDistribution 보완.
  const monthlyRaw = await readLatestRaw("moj_immigration_monthly_2024");
  let monthlyNationalityDist = [];
  if (monthlyRaw) {
    const parsed = parseCsv(monthlyRaw.text);
    const agg = aggregateStatusWide(parsed, "법무부 출입국 외국인 통계월보", "https://www.data.go.kr/data/3069975/fileData.do");
    monthlyNationalityDist = agg.nationals;
  }
  // 월보 합계가 연간 현황보다 크면(더 최신) 월보 우선 사용.
  const monthlyTotal = monthlyNationalityDist.reduce((s, r) => s + r.residents, 0);
  const annualTotal = nationalityDistribution.reduce((s, r) => s + r.residents, 0);
  const finalNationalityDist = monthlyTotal > annualTotal ? monthlyNationalityDist : nationalityDistribution;

  // 교육부 최신 유학생 현황(moe) → 대학별 랭킹 1차 소스.
  // 대학별 외국인유학생 랭킹: 대학알리미/유학생관리정보(학생단위 레코드)가 1차 — 학교별 집계로 실제 대학 top30 산출.
  // 주의: 과거 1차였던 moe_foreign_student_latest는 실제로 '세종시 고등학교' 파일(대학 0개)이라 랭킹을 1건으로 망가뜨렸다 → 폴백으로만.
  const academyRaw = await readLatestRaw("academyinfo_foreign_student_count");
  const moeStudentRaw = await readLatestRaw("moe_foreign_student_latest");
  let universityRanking = { latestYear: null, universities: [], universityCount: 0, totalForeignStudents: 0 };
  if (academyRaw) {
    // baseYear 2025: academyinfo(3069982) 학생단위 레코드는 연도 컬럼이 없음. 라이브 확인 결과 데이터 빈티지=2025년 기준.
    universityRanking = transformAcademyUniversities(parseCsv(academyRaw.text), 2025);
  }
  // moe_foreign_student_latest(세종 고교 파일) fallback 제거: academyinfo 미수집 시 빈값으로 두고,
  // 아래 last-good 보존이 직전 커밋 랭킹을 유지한다(고교 오데이터로 회귀 금지). transformMoeStudentsBySchool는 미사용.

  // 행안부 국적×연령 현황(국적,연령대,값,데이터기준일자) → 국적별 연령 분포.
  const moisRaw = await readLatestRaw("mois_foreign_resident_region_file");
  let regionResidents = { latestYear: null, regions: [], regionCount: 0, totalResidents: 0 };
  let nationalityByAge = { ageGroups: [], nationalities: [], items: [] };
  if (moisRaw) {
    const moisParsed = parseCsv(moisRaw.text);
    regionResidents = transformRegionResidents(moisParsed);
    nationalityByAge = transformNationalityByAge(moisParsed);
  }

  // 국민건강보험공단 외국인 건강보험 적용인구.
  const nhisRaw = await readLatestRaw("nhis_foreigner_coverage_2022");
  const healthInsurance = nhisRaw ? transformHealthInsurance(parseCsv(nhisRaw.text)) : [];

  // 여성가족부 다문화가족 현황.
  const mogefRaw = await readLatestRaw("mogef_multicultural_family_2024");
  const multiculturalFamily = mogefRaw ? transformMulticulturalFamily(parseCsv(mogefRaw.text)) : { items: [], totalCount: 0, latestYear: null };

  // 대학알리미 고등교육기관 기본현황 (위치·유형 보조).
  const uniStatsRaw = await readLatestRaw("academyinfo_university_stats");
  const universityStats = uniStatsRaw ? transformUniversityStats(parseCsv(uniStatsRaw.text)) : [];

  // API(KOSIS/openapi) 보조 데이터. 키 없으면 빈 배열. MOJ 1차 데이터와 분리 유지.
  const { apiStatus, apiRegion, apiEconActivity, parsedFiles } = await buildApiSources();

  // KOSIS 외국인 금융/소득·EPS 도입·유학생 국적/학위 (신규, JSON 직접 전용 파싱).
  const wageRaw = await readLatestRawJson("kosis_immigrant_wage_distribution");
  let foreignWage = wageRaw ? buildBandDist(wageRaw.rows, "외국인") : { latestYear: null, unit: "", distribution: [], trend: [] };
  const contractRaw = await readLatestRawJson("kosis_immigrant_contract_period");
  let foreignContract = contractRaw ? buildBandDist(contractRaw.rows, "외국인") : { latestYear: null, unit: "", distribution: [], trend: [] };
  const epsCountryRaw = await readLatestRawJson("kosis_eps_introduction_by_country");
  const epsIndustryRaw = await readLatestRawJson("kosis_eps_introduction_by_industry");
  let epsIntroduction = buildEps(epsCountryRaw?.rows ?? [], epsIndustryRaw?.rows ?? []);
  const studentNatRaw = await readLatestRawJson("kosis_foreign_student_nationality_visa");
  let studentNationality = studentNatRaw ? buildStudentNationality(studentNatRaw.rows) : { latestYear: null, byNationality: [], byDegree: [] };
  const kediRaw = await readLatestRawJson("kosis_kedi_higher_edu_foreign_students");
  let kediStudentRegion = kediRaw ? buildKediRegion(kediRaw.rows) : { latestYear: null, byRegion: [], byDegree: [] };
  const empStatusRaw = await readLatestRawJson("kosis_immigrant_employment_status");
  let foreignEmploymentStatus = empStatusRaw ? buildEmploymentStatus(empStatusRaw.rows) : { latestYear: null, unit: "", distribution: [], trend: [], regularShare: null };
  const industryRaw = await readLatestRawJson("kosis_immigrant_employment_by_industry");
  let foreignIndustry = industryRaw ? buildIndustryEmployment(industryRaw.rows) : { latestYear: null, unit: "", distribution: [], trend: [] };
  const ageRaw = await readLatestRawJson("kosis_immigrant_econ_activity_by_age");
  let foreignAgeActivity = ageRaw ? buildAgeActivity(ageRaw.rows) : { latestYear: null, unit: "", distribution: [] };

  // 한국은행 ECOS: 이전소득수지(본국송금 대리)·환율.
  const ecosTransferARaw = await readLatestRawJson("ecos_bop_transfer_income");
  const ecosTransferMRaw = await readLatestRawJson("ecos_bop_transfer_monthly");
  let bopTransferIncome = buildBopTransferIncome(ecosTransferARaw?.rows ?? [], ecosTransferMRaw?.rows ?? []);
  const ecosFxRaw = await readLatestRawJson("ecos_exchange_rate_daily");
  let exchangeRate = ecosFxRaw ? buildExchangeRate(ecosFxRaw.rows) : { latest: {}, monthly: [] };

  // 외국인 소비·거래 (data.go.kr file): 면세점 국적별 매출 · 제주 외국인 토지취득.
  const dutyFreeRaw = await readLatestRaw("jdc_dutyfree_sales_by_nationality");
  let dutyFreeSales = dutyFreeRaw ? buildDutyFreeSales(parseCsv(dutyFreeRaw.text)) : { latestYear: null, unit: "원", byNationality: [], monthly: [], foreignTotal: 0, internalTotal: 0 };
  const landRaw = await readLatestRaw("jeju_foreign_land_acquisition");
  let foreignLandAcquisition = landRaw ? buildForeignLandAcquisition(parseCsv(landRaw.text)) : { latestYear: null, unit: "백만원", byNationality: [], total: 0 };

  // ── last-good 보존: 공공 API(KOSIS·data.go.kr 등) 일시장애로 이번 수집이 빈/열화되면 ──
  // 직전 커밋된 realData.ts의 값을 유지해 배포 데이터가 회귀하지 않게 한다.
  // (커밋된 CSV 캐시가 있는 소스는 collector가 cached_raw로 살리지만, gitignore된 대용량
  //  KOSIS(json)·academyinfo는 캐시가 없어 전역 장애 시 빈값이 되므로 여기서 보존한다.)
  const prevGen = await readFile(join(generatedDir, "realData.ts"), "utf8").catch(() => "");
  const retainedExports = [];
  const lastGood = (name, fresh, isEmpty) => {
    if (!isEmpty(fresh)) return fresh;
    const prev = extractPrevExport(prevGen, name);
    if (prev != null && !isEmpty(prev)) { retainedExports.push(name); return prev; }
    return fresh;
  };
  const emptyDist = (o) => !(o && o.distribution && o.distribution.length);
  const emptyKey = (k) => (o) => !(o && Array.isArray(o[k]) && o[k].length);
  foreignWage = lastGood("realForeignWage", foreignWage, emptyDist);
  foreignContract = lastGood("realForeignContract", foreignContract, emptyDist);
  epsIntroduction = lastGood("realEpsIntroduction", epsIntroduction, emptyKey("byCountry"));
  studentNationality = lastGood("realForeignStudentNationality", studentNationality, emptyKey("byNationality"));
  kediStudentRegion = lastGood("realKediStudentRegion", kediStudentRegion, emptyKey("byRegion"));
  foreignEmploymentStatus = lastGood("realForeignEmploymentStatus", foreignEmploymentStatus, emptyDist);
  foreignIndustry = lastGood("realForeignIndustry", foreignIndustry, emptyDist);
  foreignAgeActivity = lastGood("realForeignAgeActivity", foreignAgeActivity, emptyDist);
  bopTransferIncome = lastGood("realBopTransferIncome", bopTransferIncome, emptyKey("annual"));
  exchangeRate = lastGood("realExchangeRate", exchangeRate, emptyKey("monthly"));
  dutyFreeSales = lastGood("realDutyFreeSales", dutyFreeSales, emptyKey("byNationality"));
  foreignLandAcquisition = lastGood("realForeignLandAcquisition", foreignLandAcquisition, emptyKey("byNationality"));
  // 대학 랭킹: academyinfo 미수집(<10개교)이면 직전 랭킹+요약 복원(세종 고교 같은 오데이터로 회귀 금지).
  const prevRanking = extractPrevExport(prevGen, "realUniversityRanking");
  const prevUniSummary = extractPrevExport(prevGen, "realUniversitySummary");
  if (universityRanking.universities.length < 10 && Array.isArray(prevRanking) && prevRanking.length >= 10) {
    retainedExports.push("realUniversityRanking");
    universityRanking = {
      universities: prevRanking,
      latestYear: prevUniSummary?.latestYear ?? null,
      universityCount: prevUniSummary?.universityCount ?? prevRanking.length,
      totalForeignStudents: prevUniSummary?.totalForeignStudents ?? 0
    };
  }
  if (retainedExports.length) {
    console.error(`[LAST-GOOD] 이번 수집 실패로 ${retainedExports.length}개 export를 직전 커밋값으로 유지: ${retainedExports.join(", ")}`);
  } else {
    console.log("[LAST-GOOD] 보존 불필요 — 모든 핵심 export 신규 수집 성공");
  }

  // ── 데이터 품질 가드: 주요 '스톡' 시계열의 비정상 급락 감지(손상/집계기준변동 조기 경보) ──
  // 스톡(누적 인원·잔액) 시계열에만 적용한다. EPS 신규 도입 등 'flow(연간 신규)' 시계열은
  // 본질적으로 변동이 커(2020 COVID 국경폐쇄로 -87% 등 정상적 급변) 가드 대상에서 제외.
  const dataQualityWarnings = [
    ...detectTrendAnomalies(studentByYear, { valueKey: "total", dropPct: 20, label: "유학생 추이(전체)" }),
    ...detectTrendAnomalies(studentByYear, { valueKey: "degree", dropPct: 30, label: "유학생 추이(학위 D-2)" }),
    ...detectTrendAnomalies(bopTransferIncome.annual ?? [], { valueKey: "value", dropPct: 35, label: "이전소득수지(ECOS)" }),
    ...detectTrendAnomalies(foreignWage.trend ?? [], { valueKey: "value", dropPct: 30, label: "외국인 임금 합계" }),
    ...detectTrendAnomalies(foreignEmploymentStatus.trend ?? [], { valueKey: "value", dropPct: 25, label: "외국인 취업자 합계" })
  ];
  if (dataQualityWarnings.length) {
    console.error(`\n[DATA-QUALITY] 비정상 급락 ${dataQualityWarnings.length}건 감지 — 소스 점검 필요:`);
    for (const w of dataQualityWarnings) console.error(`  - ${w.message}`);
  } else {
    console.log("[DATA-QUALITY] 주요 시계열 비정상 급락 없음 — OK");
  }

  const generated =
    `// Auto-generated by scripts/build_real_data.mjs. Do not edit by hand.\n\n` +
    `import type { ForeignResidentRegionMonth, ForeignResidentStatus } from "@/lib/types/foreignResident";\n\n` +
    `export const realForeignResidentStatus: readonly ForeignResidentStatus[] = ${JSON.stringify(statusRows, null, 2)};\n\n` +
    `export const realRegionData: readonly ForeignResidentRegionMonth[] = ${JSON.stringify(regionRows, null, 2)};\n\n` +
    `// API(KOSIS/data.go.kr) 수집 보조 데이터. 1차(MOJ) 집계와 분리해 제공한다.\n` +
    `export const realApiStatusData: readonly ForeignResidentStatus[] = ${JSON.stringify(apiStatus, null, 2)};\n\n` +
    `export const realApiRegionData: readonly ForeignResidentRegionMonth[] = ${JSON.stringify(apiRegion, null, 2)};\n\n` +
    `// KOSIS 경제활동인구(취업자·실업자 등) — nationality 없는 집계 시계열.\n` +
    `export type RealEconActivity = { period: string; category: string; value: number; sourceId: string; provider: string; title: string };\n` +
    `export const realEconActivity: readonly RealEconActivity[] = ${JSON.stringify(apiEconActivity, null, 2)};\n\n` +
    `// 국적 분포 + 비자/세그먼트 분포 — 국적·체류자격 페이지가 사용.\n` +
    `export type RealNationalityDist = { nationality: string; residents: number; share: number };\n` +
    `export type RealVisaSegment = { name: string; value: number };\n` +
    `export type RealVisaType = { visaCode: string; visaName: string; count: number; segment: string };\n` +
    `export const realNationalityDistribution: readonly RealNationalityDist[] = ${JSON.stringify(finalNationalityDist, null, 2)};\n\n` +
    `export const realVisaDistribution: readonly RealVisaSegment[] = ${JSON.stringify(visaDistribution, null, 2)};\n\n` +
    `export const realStayVisaTypes: readonly RealVisaType[] = ${JSON.stringify(stayVisaTypes, null, 2)};\n\n` +
    `// 외국인 유학생 체류현황(법무부). 연도×체류자격 집계 — 대학/유학생 페이지가 사용.\n` +
    `export type RealStudentYear = { year: number; total: number; degree: number; language: number; asOfMonth?: string };\n` +
    `export type RealStudentVisa = { visaRaw: string; course: string; count: number };\n` +
    `export const realForeignStudentByYear: readonly RealStudentYear[] = ${JSON.stringify(studentByYear, null, 2)};\n\n` +
    `export const realForeignStudentByVisa: readonly RealStudentVisa[] = ${JSON.stringify(studentByVisa, null, 2)};\n\n` +
    `export const realStudentSummary = ${JSON.stringify(studentSummary, null, 2)} as const;\n\n` +
    `// 대학별 외국인유학생수 — 대학/유학생 페이지가 사용 (교육부 1차, 대학알리미 폴백).\n` +
    `export type RealUniversity = { rank: number; university: string; campus: string | null; sido?: string | null; foreignStudents: number; foreignShare: number | null };\n` +
    `export const realUniversityRanking: readonly RealUniversity[] = ${JSON.stringify(universityRanking.universities, null, 2)};\n\n` +
    `export const realUniversitySummary = ${JSON.stringify({
      latestYear: universityRanking.latestYear,
      universityCount: universityRanking.universityCount,
      totalForeignStudents: universityRanking.totalForeignStudents
    }, null, 2)} as const;\n\n` +
    `// 행안부 시군구 외국인주민 현황 — 지역 분석 페이지가 사용.\n` +
    `export type RealRegionResident = { sido: string; sigungu: string; count: number };\n` +
    `export const realRegionResidents: readonly RealRegionResident[] = ${JSON.stringify(regionResidents.regions, null, 2)};\n\n` +
    `export const realRegionResidentSummary = ${JSON.stringify({
      latestYear: regionResidents.latestYear,
      regionCount: regionResidents.regionCount,
      totalResidents: regionResidents.totalResidents
    }, null, 2)} as const;\n\n` +
    `// 행안부 국적×연령대 현황 — 국적 분석 페이지가 사용.\n` +
    `export type RealNationalityAge = { nationality: string; ageGroup: string; count: number };\n` +
    `export const realNationalityByAge: readonly RealNationalityAge[] = ${JSON.stringify(nationalityByAge.items, null, 2)};\n\n` +
    `export const realNationalityAgeGroups: readonly string[] = ${JSON.stringify(nationalityByAge.ageGroups, null, 2)};\n\n` +
    `export const realNationalityAgeTotals: readonly { nationality: string; total: number }[] = ${JSON.stringify(nationalityByAge.nationalities, null, 2)};\n\n` +
    `// 국민건강보험공단 외국인 건강보험 적용인구 — 소득·취업형태 보조 지표.\n` +
    `export type RealHealthInsurance = { region: string; workplace: number; regional: number; total: number };\n` +
    `export const realHealthInsurance: readonly RealHealthInsurance[] = ${JSON.stringify(healthInsurance, null, 2)};\n\n` +
    `// 여성가족부 다문화가족 현황.\n` +
    `export type RealMulticulturalFamily = { region: string; total: number; marriage: number; children: number };\n` +
    `export const realMulticulturalFamily: readonly RealMulticulturalFamily[] = ${JSON.stringify(multiculturalFamily.items, null, 2)};\n\n` +
    `export const realMulticulturalFamilySummary = ${JSON.stringify({ totalCount: multiculturalFamily.totalCount, latestYear: multiculturalFamily.latestYear }, null, 2)} as const;\n\n` +
    `// 대학알리미 고등교육기관 기본현황 (위치·유형 보조).\n` +
    `export type RealUniversityStat = { name: string; type: string; region: string };\n` +
    `export const realUniversityStats: readonly RealUniversityStat[] = ${JSON.stringify(universityStats.slice(0, 200), null, 2)};\n\n` +
    `// ── 외국인 금융/소득(임금·고용계약)·EPS 도입·유학생 국적/학위 (KOSIS, 2026-06-16 추가) ──\n` +
    `// financial-insights·universities·nationalities·홈 KPI가 사용.\n` +
    `export const realForeignWage = ${JSON.stringify(foreignWage, null, 2)} as const;\n\n` +
    `export const realForeignContract = ${JSON.stringify(foreignContract, null, 2)} as const;\n\n` +
    `export const realEpsIntroduction = ${JSON.stringify(epsIntroduction, null, 2)} as const;\n\n` +
    `export const realForeignStudentNationality = ${JSON.stringify(studentNationality, null, 2)} as const;\n\n` +
    `export const realKediStudentRegion = ${JSON.stringify(kediStudentRegion, null, 2)} as const;\n\n` +
    `// ── 외국인 종사상지위·산업별 취업·연령별 경제활동 (KOSIS 이민자체류실태조사, 2026-06-16 추가) ──\n` +
    `// financial-insights가 사용 (소득 안정성·업종·연령 세그먼트).\n` +
    `export const realForeignEmploymentStatus = ${JSON.stringify(foreignEmploymentStatus, null, 2)} as const;\n\n` +
    `export const realForeignIndustry = ${JSON.stringify(foreignIndustry, null, 2)} as const;\n\n` +
    `export const realForeignAgeActivity = ${JSON.stringify(foreignAgeActivity, null, 2)} as const;\n\n` +
    `// ── 한국은행 ECOS: 이전소득수지(본국송금 거시 대리)·주요 환율 (2026-06-16 추가) ──\n` +
    `// financial-insights '거시 금융지표'가 사용.\n` +
    `export const realBopTransferIncome = ${JSON.stringify(bopTransferIncome, null, 2)} as const;\n\n` +
    `export const realExchangeRate = ${JSON.stringify(exchangeRate, null, 2)} as const;\n\n` +
    `// ── 외국인 소비·거래 (data.go.kr file): 면세점 국적별 매출 · 제주 외국인 토지취득 (2026-06-16 추가) ──\n` +
    `export const realDutyFreeSales = ${JSON.stringify(dutyFreeSales, null, 2)} as const;\n\n` +
    `export const realForeignLandAcquisition = ${JSON.stringify(foreignLandAcquisition, null, 2)} as const;\n\n` +
    `// ── 데이터 품질 가드 결과: 주요 시계열 비정상 급락 경보 (2026-06-16 추가) ──\n` +
    `// 빈 배열 = 모든 시계열 정상. 비어있지 않으면 해당 소스의 손상/집계기준 변동을 점검해야 한다.\n` +
    `export type RealDataQualityWarning = { series: string; field: string; period: number; prevPeriod: number; changePct: number; message: string };\n` +
    `export const realDataQualityWarnings: readonly RealDataQualityWarning[] = ${JSON.stringify(dataQualityWarnings, null, 2)};\n\n` +
    `export const realDataSummary = ${JSON.stringify({
      generatedAt: new Date().toISOString(),
      dataQualityWarningCount: dataQualityWarnings.length,
      retainedExportCount: retainedExports.length,
      retainedExports,
      statusRowCount: statusRows.length,
      nationalityCount: finalNationalityDist.length,
      nationalitySource: monthlyTotal > annualTotal ? "monthly" : "annual",
      visaSegmentCount: visaDistribution.length,
      regionRowCount: regionRows.length,
      apiStatusRowCount: apiStatus.length,
      apiRegionRowCount: apiRegion.length,
      apiEconActivityCount: apiEconActivity.length,
      studentYearCount: studentByYear.length,
      universityCount: universityRanking.universityCount,
      regionResidentCount: regionResidents.regionCount,
      nationalityByAgeCount: nationalityByAge.items.length,
      healthInsuranceCount: healthInsurance.length,
      multiculturalFamilyCount: multiculturalFamily.items.length,
      universityStatsCount: universityStats.length,
      apiParsedFiles: parsedFiles,
      sourceFiles: {
        status: statusRaw?.path ?? null,
        stay: stayRaw?.path ?? null,
        student: studentRaw?.path ?? null,
        moeStudent: moeStudentRaw?.path ?? null,
        mois: moisRaw?.path ?? null,
        monthly: monthlyRaw?.path ?? null
      }
    }, null, 2)} as const;\n`;

  await writeFile(
    join(processedDir, "foreign_resident_status.real.json"),
    JSON.stringify(statusRows, null, 2),
    "utf8"
  );
  await writeFile(
    join(processedDir, "foreign_resident_region_month.real.json"),
    JSON.stringify(regionRows, null, 2),
    "utf8"
  );
  await writeFile(join(generatedDir, "realData.ts"), generated, "utf8");

  const lineageTotals = await buildLineage();

  console.log(
    JSON.stringify(
      {
        ok: true,
        statusRowCount: statusRows.length,
        nationalityCount: finalNationalityDist.length,
        visaSegmentCount: visaDistribution.length,
        regionRowCount: regionRows.length,
        apiStatusRowCount: apiStatus.length,
        apiRegionRowCount: apiRegion.length,
        apiEconActivityCount: apiEconActivity.length,
        universityCount: universityRanking.universityCount,
        nationalityByAgeCount: nationalityByAge.items.length,
        lineage: lineageTotals
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
