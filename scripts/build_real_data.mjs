import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
    foundCount: d.foundCount ?? (d.links?.length ?? 0)
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
    `export type DataLineageDiscovery = {\n` +
    `  id: string;\n  provider: string;\n  keyword: string;\n  purpose: string;\n` +
    `  status: string;\n  foundCount: number;\n};\n\n` +
    `export type DataLineage = {\n` +
    `  generatedAt: string;\n` +
    `  keysPresent: { DATA_GO_KR_SERVICE_KEY: boolean; KOSIS_API_KEY: boolean };\n` +
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
  const generated = `// Auto-generated by scripts/build_real_data.mjs. Do not edit by hand.\n\nimport type { ForeignResidentRegionMonth, ForeignResidentStatus } from "@/lib/types/foreignResident";\n\nexport const realForeignResidentStatus: readonly ForeignResidentStatus[] = ${JSON.stringify(statusRows, null, 2)};\n\nexport const realRegionData: readonly ForeignResidentRegionMonth[] = ${JSON.stringify(regionRows, null, 2)};\n\nexport const realDataSummary = ${JSON.stringify({
    generatedAt: new Date().toISOString(),
    statusRowCount: statusRows.length,
    regionRowCount: regionRows.length,
    sourceFiles: {
      status: statusRaw?.path ?? null
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
        regionRowCount: regionRows.length,
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
