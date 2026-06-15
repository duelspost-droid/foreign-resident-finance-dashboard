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
function transformAcademyUniversities(rows) {
  if (!rows.length) return { latestYear: null, universities: [], universityCount: 0, totalForeignStudents: 0 };
  logColumnDiag("academyinfo", rows);

  const headers = Object.keys(rows[0]).filter((k) => k !== "__rowNumber");
  const hasCountCol = headers.some((h) =>
    ["외국인유학생수", "유학생수", "외국인학생수", "외국인재학생수"].some((c) => h.includes(c))
  );

  const yearOf = (r) => toNumber(firstValue(r, ["기준연도", "학년도", "연도", "년도", "년"]));
  const years = rows.map(yearOf).filter((y) => y >= 2000 && y <= 2100);
  const latestYear = years.length ? Math.max(...years) : null;
  const agg = new Map();
  for (const r of rows) {
    if (latestYear && yearOf(r) && yearOf(r) !== latestYear) continue;
    const uni = String(firstValue(r, ["대학명", "학교명", "기관명", "대학", "학교"])).trim();
    if (!uni || /합계|소계|총계|전체/.test(uni)) continue;
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
  const studentRaw = await readLatestRaw("moj_foreign_student_stay");
  let studentByYear = [];
  let studentByVisa = [];
  let studentSummary = { hasData: false, latestYear: null, total: 0, degree: 0, language: 0, yoy: 0 };
  if (studentRaw) {
    const studentRows = transformStudentStay(parseCsv(studentRaw.text));
    const agg = summarizeStudents(studentRows);
    studentByYear = agg.yearSeries;
    studentByVisa = agg.byVisa;
    studentSummary = agg.summary;
  }

  // 교육부 최신 유학생 현황(moe) → 대학별 랭킹 1차 소스.
  const moeStudentRaw = await readLatestRaw("moe_foreign_student_latest");
  let universityRanking = { latestYear: null, universities: [], universityCount: 0, totalForeignStudents: 0 };
  if (moeStudentRaw) {
    const moeResult = transformMoeStudentsBySchool(parseCsv(moeStudentRaw.text));
    if (moeResult.universities.length > 0) universityRanking = moeResult;
  }
  // 대학알리미 → 폴백 (MOE 데이터 없을 때만 사용).
  if (universityRanking.universities.length === 0) {
    const academyRaw = await readLatestRaw("academyinfo_foreign_student_count");
    if (academyRaw) {
      universityRanking = transformAcademyUniversities(parseCsv(academyRaw.text));
    }
  }

  // 행안부 국적×연령 현황(국적,연령대,값,데이터기준일자) → 국적별 연령 분포.
  const moisRaw = await readLatestRaw("mois_foreign_resident_region_file");
  let regionResidents = { latestYear: null, regions: [], regionCount: 0, totalResidents: 0 };
  let nationalityByAge = { ageGroups: [], nationalities: [], items: [] };
  if (moisRaw) {
    const moisParsed = parseCsv(moisRaw.text);
    regionResidents = transformRegionResidents(moisParsed);
    nationalityByAge = transformNationalityByAge(moisParsed);
  }

  // API(KOSIS/openapi) 보조 데이터. 키 없으면 빈 배열. MOJ 1차 데이터와 분리 유지.
  const { apiStatus, apiRegion, apiEconActivity, parsedFiles } = await buildApiSources();

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
    `export const realNationalityDistribution: readonly RealNationalityDist[] = ${JSON.stringify(nationalityDistribution, null, 2)};\n\n` +
    `export const realVisaDistribution: readonly RealVisaSegment[] = ${JSON.stringify(visaDistribution, null, 2)};\n\n` +
    `export const realStayVisaTypes: readonly RealVisaType[] = ${JSON.stringify(stayVisaTypes, null, 2)};\n\n` +
    `// 외국인 유학생 체류현황(법무부). 연도×체류자격 집계 — 대학/유학생 페이지가 사용.\n` +
    `export type RealStudentYear = { year: number; total: number; degree: number; language: number };\n` +
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
    `export const realDataSummary = ${JSON.stringify({
      generatedAt: new Date().toISOString(),
      statusRowCount: statusRows.length,
      nationalityCount: nationalityDistribution.length,
      visaSegmentCount: visaDistribution.length,
      regionRowCount: regionRows.length,
      apiStatusRowCount: apiStatus.length,
      apiRegionRowCount: apiRegion.length,
      apiEconActivityCount: apiEconActivity.length,
      studentYearCount: studentByYear.length,
      universityCount: universityRanking.universityCount,
      regionResidentCount: regionResidents.regionCount,
      nationalityByAgeCount: nationalityByAge.items.length,
      apiParsedFiles: parsedFiles,
      sourceFiles: {
        status: statusRaw?.path ?? null,
        stay: stayRaw?.path ?? null,
        student: studentRaw?.path ?? null,
        moeStudent: moeStudentRaw?.path ?? null,
        mois: moisRaw?.path ?? null
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
        nationalityCount: nationalityDistribution.length,
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
