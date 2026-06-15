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
  const value = `${visaCode} ${visaName}`;
  if (value.includes("D-2") || value.includes("유학")) return "유학생";
  if (value.includes("D-4") || value.includes("연수")) return "어학연수생";
  if (value.includes("E-9") || value.includes("비전문")) return "비전문취업 근로자";
  if (value.includes("E-7") || value.includes("전문")) return "전문인력";
  if (value.includes("F-4") || value.includes("동포")) return "재외동포";
  if (value.includes("F-6") || value.includes("결혼")) return "결혼이민";
  if (value.includes("C-3") || value.includes("단기")) return "단기체류";
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

function transformStatus(rows) {
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
  const parsedFiles = [];

  for (const source of publicDataSources) {
    if (source.type !== "kosis" && source.type !== "openapi") continue;
    const mapping = source.responseMapping;
    if (!mapping) continue;
    const raw = await readLatestRawJson(source.outputBaseName);
    if (!raw || raw.rows.length === 0) continue;

    let produced = 0;
    if (source.targetTable === "foreign_resident_status") {
      const rows = transformKosisStatus(raw.rows, mapping, source);
      apiStatus.push(...rows);
      produced = rows.length;
    } else {
      const rows = transformRegionRows(raw.rows, mapping, source);
      apiRegion.push(...rows);
      produced = rows.length;
    }
    parsedFiles.push({ source: source.id, file: raw.file, produced });
  }

  return { apiStatus, apiRegion, parsedFiles };
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

  const statusRaw = await readLatestRaw("moj_foreign_resident_status_2024");
  let statusRows = [];
  if (statusRaw) {
    statusRows = transformStatus(parseCsv(statusRaw.text));
  }

  const regionRows = summarizeStatus(statusRows).slice(0, 200);

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

  // API(KOSIS/openapi) 보조 데이터. 키 없으면 빈 배열. MOJ 1차 데이터와 분리 유지.
  const { apiStatus, apiRegion, parsedFiles } = await buildApiSources();

  const generated =
    `// Auto-generated by scripts/build_real_data.mjs. Do not edit by hand.\n\n` +
    `import type { ForeignResidentRegionMonth, ForeignResidentStatus } from "@/lib/types/foreignResident";\n\n` +
    `export const realForeignResidentStatus: readonly ForeignResidentStatus[] = ${JSON.stringify(statusRows, null, 2)};\n\n` +
    `export const realRegionData: readonly ForeignResidentRegionMonth[] = ${JSON.stringify(regionRows, null, 2)};\n\n` +
    `// API(KOSIS/data.go.kr) 수집 보조 데이터. 1차(MOJ) 집계와 분리해 제공한다.\n` +
    `export const realApiStatusData: readonly ForeignResidentStatus[] = ${JSON.stringify(apiStatus, null, 2)};\n\n` +
    `export const realApiRegionData: readonly ForeignResidentRegionMonth[] = ${JSON.stringify(apiRegion, null, 2)};\n\n` +
    `// 외국인 유학생 체류현황(법무부). 연도×체류자격 집계 — 대학/유학생 페이지가 사용.\n` +
    `export type RealStudentYear = { year: number; total: number; degree: number; language: number };\n` +
    `export type RealStudentVisa = { visaRaw: string; course: string; count: number };\n` +
    `export const realForeignStudentByYear: readonly RealStudentYear[] = ${JSON.stringify(studentByYear, null, 2)};\n\n` +
    `export const realForeignStudentByVisa: readonly RealStudentVisa[] = ${JSON.stringify(studentByVisa, null, 2)};\n\n` +
    `export const realStudentSummary = ${JSON.stringify(studentSummary, null, 2)} as const;\n\n` +
    `export const realDataSummary = ${JSON.stringify({
      generatedAt: new Date().toISOString(),
      statusRowCount: statusRows.length,
      regionRowCount: regionRows.length,
      apiStatusRowCount: apiStatus.length,
      apiRegionRowCount: apiRegion.length,
      studentYearCount: studentByYear.length,
      apiParsedFiles: parsedFiles,
      sourceFiles: { status: statusRaw?.path ?? null, student: studentRaw?.path ?? null }
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
        regionRowCount: regionRows.length,
        apiStatusRowCount: apiStatus.length,
        apiRegionRowCount: apiRegion.length,
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
