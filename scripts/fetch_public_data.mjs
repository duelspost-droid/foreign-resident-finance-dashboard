import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { publicDataSources, discoveryQueries } from "./data_sources.mjs";

const execFileAsync = promisify(execFile);
const COLLECT_CONCURRENCY = Number(process.env.COLLECT_CONCURRENCY ?? "4");

const root = process.cwd();
const rawDir = join(root, "data", "raw");
const catalogDir = join(root, "data", "catalog");

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 한국 정부 파일은 종종 EUC-KR/CP949 인코딩. UTF-8 BOM이 있으면 utf-8,
// 없으면 EUC-KR 2바이트 쌍(0xA1~0xFE) 수 vs UTF-8 멀티바이트 시퀀스 수를 비교해 판단.
function detectEncoding(buf) {
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return "utf-8";
  const sample = buf.slice(0, 4096);
  let eucKrPairs = 0;
  let validUtf8 = 0;
  for (let i = 0; i < sample.length - 1; i++) {
    const b = sample[i];
    if (b >= 0xA1 && b <= 0xFE && sample[i + 1] >= 0xA1 && sample[i + 1] <= 0xFE) {
      eucKrPairs++; i++;
    } else if ((b & 0xE0) === 0xC0 && (sample[i + 1] & 0xC0) === 0x80) {
      validUtf8++; i++;
    } else if (i + 2 < sample.length && (b & 0xF0) === 0xE0 &&
               (sample[i + 1] & 0xC0) === 0x80 && (sample[i + 2] & 0xC0) === 0x80) {
      validUtf8++; i += 2;
    }
  }
  return (eucKrPairs > validUtf8 && eucKrPairs > 3) ? "euc-kr" : "utf-8";
}

// ZIP 파일 압축 해제 후 내부 CSV/XLSX 파일 경로를 반환. 실패 시 null.
async function extractZip(zipPath) {
  const extractDir = zipPath + "_ext";
  try {
    await execFileAsync("unzip", ["-o", "-q", zipPath, "-d", extractDir]);
    const allFiles = await readdir(extractDir, { recursive: true });
    const dataFiles = allFiles.filter((f) => /\.(csv|xlsx|xls)$/i.test(f)).sort();
    if (dataFiles.length === 0) return null;
    return join(extractDir, dataFiles[0]);
  } catch {
    return null;
  }
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function maskKey(value) {
  if (!value) return null;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS ?? 15000);

async function fetchWithRetry(url, options = {}, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent":
            "foreign-resident-finance-dashboard/0.1 data collector",
          ...(options.headers ?? {})
        }
      });
      clearTimeout(timeout);
      return res;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < attempts) {
        await sleep(1000 * attempt);
      }
    }
  }
  throw lastError;
}

async function fetchText(url) {
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

// ── 파일데이터(data.go.kr fileData) 수집 ────────────────────────────────────────

// 파일 다운로드 페이지에서 모든 리소스를 파싱하여 가장 최신 연도 파일을 선택한다.
// fn_fileDataDown(datasetId, detailPk, ?, type, filename) 형태.
// 파일명 또는 페이지 내 연도 힌트 텍스트에서 연도를 추출해 내림차순 정렬.
function extractDetailPk(html) {
  const RE = /fn_fileDataDown\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)/g;
  const entries = [...html.matchAll(RE)].map((m) => {
    const detailPk = m[2];
    const fileName = m[5] ?? "";
    // 연도 힌트: 파일명 안의 4자리 숫자(2010~2099), 없으면 0
    const yearMatch = fileName.match(/20([1-9]\d)/);
    const year = yearMatch ? Number(yearMatch[0]) : 0;
    return { detailPk, fileName, year };
  });
  if (entries.length === 0) return null;
  // 가장 최신 연도 파일을 우선 선택 (같은 연도면 목록 순 마지막 → 최신 업로드)
  entries.sort((a, b) => b.year - a.year || 0);
  return entries[0].detailPk;
}

// 어떤 리소스들이 있는지 카탈로그에 남기기 위해 전체 목록도 반환한다.
function extractAllResources(html) {
  const RE = /fn_fileDataDown\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)/g;
  return [...html.matchAll(RE)].map((m) => ({
    detailPk: m[2],
    fileName: m[5] ?? "",
    year: Number((m[5] ?? "").match(/20([1-9]\d)/)?.[0] ?? 0)
  }));
}

async function getFileMeta(source) {
  const detailUrl = `https://www.data.go.kr/data/${source.datasetId}/fileData.do`;
  const html = await fetchText(detailUrl);

  // 전체 리소스 목록 파싱 — 다년도 파일 중 최신 선택
  const allResources = extractAllResources(html);
  const detailPk = source.detailPk ?? extractDetailPk(html);

  if (!detailPk) {
    return { source, detailUrl, status: "metadata_missing", reason: "publicDataDetailPk not found", allResources };
  }

  const metaUrl = new URL("https://www.data.go.kr/tcs/dss/selectFileDataDownload.do");
  metaUrl.searchParams.set("publicDataPk", source.datasetId);
  metaUrl.searchParams.set("publicDataDetailPk", detailPk);
  metaUrl.searchParams.set("dataSetFileDetailInfo", "1");

  const res = await fetchWithRetry(metaUrl);
  if (!res.ok) {
    return { source, detailUrl, detailPk, status: "metadata_request_failed", reason: `${res.status} ${res.statusText}` };
  }

  const meta = await res.json();
  const fileInfo = meta.fileDataRegistVO ?? {};
  return {
    source,
    detailUrl,
    detailPk,
    allResources,          // 페이지 내 전체 리소스(다년도 파일 확인용)
    status: meta.status ? "metadata_ok" : "metadata_not_confirmed",
    atchFileId: meta.atchFileId ?? fileInfo.atchFileId ?? null,
    fileDetailSn: meta.fileDetailSn ?? fileInfo.fileDetailSn ?? "1",
    originalFileName: fileInfo.orginlFileNm ?? null,
    extension: fileInfo.atchFileExtsn ?? "csv",
    rowCount: Number(fileInfo.atchFileCo ?? 0),
    dataName: fileInfo.dataNm ?? source.title
  };
}

function candidateDownloadUrls(meta) {
  const urls = [];
  if (meta.atchFileId && meta.fileDetailSn) {
    urls.push(
      `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${encodeURIComponent(meta.atchFileId)}&fileDetailSn=${encodeURIComponent(meta.fileDetailSn)}`
    );
  }
  if (meta.detailPk) {
    urls.push(
      `https://www.data.go.kr/download/${encodeURIComponent(meta.detailPk)}/fileData.do?publicDataHistSn=1`
    );
  }
  return urls;
}

// 저장된 CSV의 헤더(첫 줄)를 읽어 카탈로그에 기록한다. 다운로드된 파일의 컬럼 구조를
// 파악해 build_real_data 파서를 정확히 작성하기 위한 진단 정보.
async function peekHeader(path) {
  try {
    const buf = await readFile(path);
    const enc = detectEncoding(buf);
    const slice = buf.subarray(0, 4096);
    const text = enc === "euc-kr" ? new TextDecoder("euc-kr").decode(slice) : slice.toString("utf8");
    return text.replace(/^﻿/, "").split(/\r?\n/, 1)[0].slice(0, 600);
  } catch {
    return null;
  }
}

async function downloadFile(meta) {
  const stamp = todayStamp();
  const extension = meta.extension || "csv";
  const fileName = `${meta.source.outputBaseName}_${stamp}.${extension}`;
  const target = join(rawDir, fileName);
  const urls = candidateDownloadUrls(meta);
  const attempts = [];

  for (const url of urls) {
    try {
      const res = await fetchWithRetry(url, { redirect: "follow", headers: { Referer: meta.detailUrl } });
      attempts.push({ url, status: res.status, contentType: res.headers.get("content-type") });
      if (!res.ok || !res.body) continue;

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        const text = await res.text();
        if (text.includes("로그인") || text.includes("에러")) continue;
        await writeFile(target, text, "utf8");
        return { ok: true, path: target, fileName, url, attempts, headerLine: await peekHeader(target) };
      }

      // 전체 버퍼로 수신 — ZIP 감지 및 인코딩 변환에 필요.
      const buf = Buffer.from(await res.arrayBuffer());

      // ZIP 감지 (magic bytes: PK\x03\x04)
      if (buf[0] === 0x50 && buf[1] === 0x4B) {
        const zipPath = target.replace(/\.[^.]+$/, ".zip");
        await writeFile(zipPath, buf);
        const innerFile = await extractZip(zipPath);
        if (innerFile) {
          await rename(innerFile, target);
          await unlink(zipPath).catch(() => {});
          return { ok: true, path: target, fileName, url, attempts, extractedFromZip: true, headerLine: await peekHeader(target) };
        }
        // 압축 해제 실패 시 ZIP 자체를 저장
        const zipName = fileName.replace(/\.[^.]+$/, ".zip");
        await rename(zipPath, join(rawDir, zipName)).catch(() => {});
        continue;
      }

      // EUC-KR / UTF-8 감지 후 UTF-8로 정규화
      const encoding = detectEncoding(buf);
      const text = encoding === "euc-kr"
        ? new TextDecoder("euc-kr").decode(buf)
        : buf.toString("utf8");
      await writeFile(target, text, "utf8");
      return { ok: true, path: target, fileName, url, attempts, encoding, headerLine: await peekHeader(target) };
    } catch (error) {
      attempts.push({ url, error: error.message });
    }
  }
  return { ok: false, attempts, reason: "All candidate download URLs failed" };
}

async function collectFileSource(source) {
  let meta;
  try {
    meta = await getFileMeta(source);
  } catch (error) {
    const cached = await findCachedRaw(source);
    return {
      status: cached ? "metadata_failed_using_cached_raw" : "metadata_failed",
      cachedRawFile: cached,
      reason: error.message,
      requestUrls: [`https://www.data.go.kr/data/${source.datasetId}/fileData.do`]
    };
  }
  if (!meta.atchFileId) {
    const cached = await findCachedRaw(source);
    return { status: cached ? "metadata_without_file_using_cached_raw" : "metadata_without_file", cachedRawFile: cached, meta, requestUrls: [meta.detailUrl] };
  }
  const download = await downloadFile(meta);
  return {
    status: download.ok ? "downloaded" : "download_failed",
    rowCount: meta.rowCount || null,
    savedFile: download.ok ? download.fileName : null,
    requestUrls: download.attempts.map((a) => a.url).filter(Boolean),
    download
  };
}

// ── data.go.kr REST 오픈API 수집 ────────────────────────────────────────────────

async function collectOpenApiSource(source) {
  const apiKey = process.env[source.apiKeyEnv];
  if (!apiKey) {
    return { status: "skipped_no_key", reason: `${source.apiKeyEnv} not set`, requestUrls: [source.endpoint] };
  }

  const pageParam = source.pagination?.pageParam ?? "pageNo";
  const rowsParam = source.pagination?.rowsParam ?? "numOfRows";
  const rows = source.pagination?.rows ?? 1000;
  const maxPages = source.pagination?.maxPages ?? 1;

  const collected = [];
  const requestUrls = [];
  const attempts = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = new URL(source.endpoint);
    url.searchParams.set("serviceKey", apiKey);
    for (const [k, v] of Object.entries(source.params ?? {})) url.searchParams.set(k, v);
    url.searchParams.set(pageParam, String(page));
    url.searchParams.set(rowsParam, String(rows));

    const safeUrl = url.toString().replace(encodeURIComponent(apiKey), maskKey(apiKey)).replace(apiKey, maskKey(apiKey));
    requestUrls.push(safeUrl);

    try {
      const res = await fetchWithRetry(url);
      attempts.push({ url: safeUrl, status: res.status });
      if (!res.ok) break;
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        attempts.push({ url: safeUrl, error: "non-JSON response (check endpoint/type=json)" });
        break;
      }
      const items = extractItems(body);
      if (items.length === 0) break;
      collected.push(...items);
      if (items.length < rows) break;
    } catch (error) {
      attempts.push({ url: safeUrl, error: error.message });
      break;
    }
  }

  if (collected.length === 0) {
    return { status: "no_data", requestUrls, attempts, reason: "0 rows (verify endpoint/params)" };
  }

  const fileName = `${source.outputBaseName}_${todayStamp()}.json`;
  await writeFile(join(rawDir, fileName), JSON.stringify(collected, null, 2), "utf8");
  return { status: "downloaded", rowCount: collected.length, savedFile: fileName, requestUrls, attempts };
}

function extractItems(body) {
  // KOSIS statisticsData.do: 배열 직접 반환
  // data.go.kr 표준: response.body.items.item / body.items / data
  const candidates = [
    Array.isArray(body) ? body : null,
    body?.response?.body?.items?.item,
    body?.response?.body?.items,
    body?.body?.items?.item,
    body?.items?.item,
    body?.items,
    body?.data,
    body?.result
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
    if (c && typeof c === "object") return [c];
  }
  return [];
}

// ── KOSIS 오픈API 수집 ──────────────────────────────────────────────────────────
//
// KOSIS 데이터 조회는 테이블별 분류코드(itmId, objL*)를 요구한다. `ALL` 만으로는
// "필수요청변수값이 누락되었습니다" 오류가 발생하므로 2단계로 호출한다:
//   1) getMeta(type=ITM) 로 실제 itmId 코드 조회
//   2) statisticsParameterData.do 에 itmId + objL*=ALL 을 넣어 데이터 조회
// getMeta 가 실패하면 source.params 의 itmId(또는 ALL)로 폴백한다.

const KOSIS_META_ENDPOINT = "https://kosis.kr/openapi/statisticsData.do";
const KOSIS_DATA_ENDPOINT = "https://kosis.kr/openapi/Param/statisticsParameterData.do";

function maskUrl(url, apiKey) {
  return url
    .toString()
    .replace(encodeURIComponent(apiKey), maskKey(apiKey))
    .replace(apiKey, maskKey(apiKey));
}

// getMeta(type=ITM) 로 itmId 목록을 가져온다. "+"로 join 한 문자열 반환(없으면 null).
async function fetchKosisItmIds(source, apiKey, attempts) {
  const url = new URL(KOSIS_META_ENDPOINT);
  url.searchParams.set("method", "getMeta");
  url.searchParams.set("type", "ITM");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("orgId", source.orgId);
  url.searchParams.set("tblId", source.tblId);
  url.searchParams.set("format", "json");
  const safeUrl = maskUrl(url, apiKey);
  try {
    const res = await fetchWithRetry(url);
    attempts.push({ step: "getMeta(ITM)", url: safeUrl, status: res.status });
    if (!res.ok) return null;
    const body = JSON.parse(await res.text());
    if (body?.err || body?.errMsg) {
      attempts.push({ step: "getMeta(ITM)", error: body.errMsg ?? body.err });
      return null;
    }
    const rows = Array.isArray(body) ? body : extractItems(body);
    const ids = [...new Set(rows.map((r) => r.ITM_ID ?? r.itmId).filter(Boolean))];
    return ids.length > 0 ? ids.slice(0, 50).join("+") : null;
  } catch (error) {
    attempts.push({ step: "getMeta(ITM)", error: error.message });
    return null;
  }
}

// KOSIS metaData.do(method=periodData)로 해당 테이블의 최신 발행 기간을 조회한다.
// 성공 시 가장 최근 PRD_DE 문자열 반환, 실패 시 null.
async function getKosisLatestPeriod(apiKey, orgId, tblId) {
  try {
    const url = new URL("https://kosis.kr/openapi/metaData.do");
    url.searchParams.set("method", "periodData");
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("tblId", tblId);
    url.searchParams.set("format", "json");
    const res = await fetchWithRetry(url, {}, 2);
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    if (!Array.isArray(body) || body.length === 0) return null;
    // PRD_DE 내림차순 정렬 후 첫 번째 기간 반환
    const sorted = body
      .map((r) => r.PRD_DE ?? r.prd_de ?? "")
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    return sorted[0] ?? null;
  } catch {
    return null;
  }
}

async function collectKosisSource(source) {
  const apiKey = process.env[source.apiKeyEnv];
  if (!apiKey) {
    return { status: "skipped_no_key", reason: `${source.apiKeyEnv} not set`, requestUrls: [source.endpoint] };
  }

  const attempts = [];
  const requestUrls = [];

  // 1단계: 실제 itmId 코드 조회 (실패 시 params.itmId 또는 ALL 폴백)
  const metaItmId = await fetchKosisItmIds(source, apiKey, attempts);
  const itmId = metaItmId ?? source.params?.itmId ?? "ALL";

  // 종료 기간 동적 결정: metaData.do(periodData)로 실제 최신 발행 기간을 조회한다.
  // 조회 실패 시 source.params.endPrdDe(=CY) 또는 현재 연도로 폴백 — 미발행 미래 연도 요청 오류 방지.
  const latestPeriod = await getKosisLatestPeriod(apiKey, source.orgId, source.tblId);

  // 2단계: statisticsParameterData.do 로 데이터 조회
  const dataUrl = new URL(source.dataEndpoint ?? KOSIS_DATA_ENDPOINT);
  dataUrl.searchParams.set("method", "getList");
  dataUrl.searchParams.set("apiKey", apiKey);
  dataUrl.searchParams.set("orgId", source.orgId);
  dataUrl.searchParams.set("tblId", source.tblId);
  dataUrl.searchParams.set("itmId", itmId);
  // 분류 레벨(objL): 빈 값을 보내면 KOSIS가 "필수요청변수값 누락(objL)" 오류를 낸다.
  // objL1은 기본 ALL, objL2~objL8은 source.params에 명시된 비어있지 않은 값만 전송한다.
  dataUrl.searchParams.set("objL1", source.params?.objL1 ?? "ALL");
  for (let lvl = 2; lvl <= 8; lvl += 1) {
    const v = source.params?.[`objL${lvl}`];
    if (v != null && v !== "") dataUrl.searchParams.set(`objL${lvl}`, v);
  }
  dataUrl.searchParams.set("format", "json");
  dataUrl.searchParams.set("jsonVD", "Y");
  dataUrl.searchParams.set("prdSe", source.params?.prdSe ?? "Y");

  // 기간: newEstPrdCnt(최근 N기)가 지정되면 우선 사용(연도 하드코딩 없음).
  // 아니면 startPrdDe + 동적 endPrdDe(최신 발행 기간).
  if (source.params?.newEstPrdCnt) {
    dataUrl.searchParams.set("newEstPrdCnt", String(source.params.newEstPrdCnt));
  } else {
    const fallbackEnd = source.params?.endPrdDe ?? String(new Date().getFullYear());
    dataUrl.searchParams.set("startPrdDe", source.params?.startPrdDe ?? "2020");
    dataUrl.searchParams.set("endPrdDe", latestPeriod ?? fallbackEnd);
  }

  const safeDataUrl = maskUrl(dataUrl, apiKey);
  requestUrls.push(safeDataUrl);

  try {
    const res = await fetchWithRetry(dataUrl);
    attempts.push({ step: "statisticsParameterData", url: safeDataUrl, status: res.status });
    if (!res.ok) {
      return { status: "request_failed", requestUrls, attempts, reason: `${res.status} ${res.statusText}` };
    }
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return { status: "non_json_response", requestUrls, attempts, reason: text.slice(0, 200) };
    }
    if (body?.err || body?.errMsg) {
      return { status: "api_error", requestUrls, attempts, reason: body.errMsg ?? body.err };
    }
    const items = Array.isArray(body) ? body : extractItems(body);
    if (items.length === 0) {
      return { status: "no_data", requestUrls, attempts, reason: "0 rows" };
    }
    const fileName = `${source.outputBaseName}_${todayStamp()}.json`;
    await writeFile(join(rawDir, fileName), JSON.stringify(items, null, 2), "utf8");
    // itmId 출처와 실제 사용한 최신 기간을 함께 기록
    return {
      status: "downloaded",
      rowCount: items.length,
      savedFile: fileName,
      requestUrls,
      attempts,
      itmIdSource: metaItmId ? "getMeta" : "fallback",
      detectedLatestPeriod: latestPeriod ?? null
    };
  } catch (error) {
    return { status: "request_failed", requestUrls, attempts, reason: error.message };
  }
}

// ── 한국은행 ECOS 오픈API 수집 ────────────────────────────────────────────────────
// URL 형식: https://ecos.bok.or.kr/api/StatisticSearch/{key}/json/kr/{start}/{end}/{statCode}/{prdCycle}/{startDate}/{endDate}
// RESULT.CODE "INFO-000" = 성공, 그 외 = 오류.
async function collectEcosSource(source) {
  const apiKey = process.env[source.apiKeyEnv];
  if (!apiKey) {
    return { status: "skipped_no_key", reason: `${source.apiKeyEnv} not set`, requestUrls: [] };
  }
  const { statCode, prdCycle = "A", startDate, endDate, rowsPerPage = 1000 } = source.params;
  const safeKey = maskKey(apiKey);
  const collected = [];
  const requestUrls = [];
  let start = 1;

  while (true) {
    const end = start + rowsPerPage - 1;
    const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/${start}/${end}/${statCode}/${prdCycle}/${startDate}/${endDate}`;
    requestUrls.push(url.replace(apiKey, safeKey));
    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) break;
      const body = await res.json().catch(() => null);
      if (body?.RESULT?.CODE && body.RESULT.CODE !== "INFO-000") {
        return { status: "api_error", requestUrls, reason: body.RESULT.MESSAGE ?? body.RESULT.CODE };
      }
      const rows = body?.StatisticSearch?.row;
      if (!Array.isArray(rows) || rows.length === 0) break;
      collected.push(...rows);
      if (rows.length < rowsPerPage) break;
      start += rowsPerPage;
    } catch (error) {
      return { status: "request_failed", requestUrls, reason: error.message };
    }
  }

  if (collected.length === 0) return { status: "no_data", requestUrls, reason: "0 rows" };
  const fileName = `${source.outputBaseName}_${todayStamp()}.json`;
  await writeFile(join(rawDir, fileName), JSON.stringify(collected, null, 2), "utf8");
  return { status: "downloaded", rowCount: collected.length, savedFile: fileName, requestUrls };
}

// ── 서울시 열린데이터광장 오픈API 수집 ─────────────────────────────────────────────
// URL 형식: https://openapi.seoul.go.kr:8088/{key}/json/{serviceName}/{start}/{end}/
// 응답: { [serviceName]: { list_total_count: N, RESULT: {...}, row: [...] } }
async function collectSeoulDataSource(source) {
  const apiKey = process.env[source.apiKeyEnv];
  if (!apiKey) {
    return { status: "skipped_no_key", reason: `${source.apiKeyEnv} not set`, requestUrls: [] };
  }
  const { serviceName, rowsPerPage = 1000 } = source.params;
  const safeKey = maskKey(apiKey);
  const collected = [];
  const requestUrls = [];
  let start = 1;

  while (true) {
    const end = start + rowsPerPage - 1;
    const url = `https://openapi.seoul.go.kr:8088/${apiKey}/json/${serviceName}/${start}/${end}/`;
    requestUrls.push(url.replace(apiKey, safeKey));
    try {
      const res = await fetchWithRetry(url);
      if (!res.ok) break;
      const body = await res.json().catch(() => null);
      const svcBody = body?.[serviceName];
      if (svcBody?.RESULT?.CODE && svcBody.RESULT.CODE !== "INFO-000") {
        return { status: "api_error", requestUrls, reason: svcBody.RESULT.MESSAGE ?? svcBody.RESULT.CODE };
      }
      const rows = svcBody?.row;
      if (!Array.isArray(rows) || rows.length === 0) break;
      collected.push(...rows);
      if (rows.length < rowsPerPage) break;
      start += rowsPerPage;
    } catch (error) {
      return { status: "request_failed", requestUrls, reason: error.message };
    }
  }

  if (collected.length === 0) return { status: "no_data", requestUrls, reason: "0 rows" };
  const fileName = `${source.outputBaseName}_${todayStamp()}.json`;
  await writeFile(join(rawDir, fileName), JSON.stringify(collected, null, 2), "utf8");
  return { status: "downloaded", rowCount: collected.length, savedFile: fileName, requestUrls };
}

// ── 공통 ────────────────────────────────────────────────────────────────────────

async function findCachedRaw(source) {
  const files = await readdir(rawDir).catch(() => []);
  return files.filter((file) => file.startsWith(source.outputBaseName)).sort().at(-1) ?? null;
}

// concurrency 수만큼 tasks(thunk 배열)를 병렬 실행. 결과 순서는 입력 순서와 동일.
async function runConcurrent(tasks, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try { results[i] = await tasks[i](); }
      catch (err) { results[i] = { error: err.message }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

async function discoverDataGoKr() {
  const results = [];
  for (const query of discoveryQueries) {
    const url = `https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=${encodeURIComponent(query.keyword)}`;
    try {
      const html = await fetchText(url);
      const links = [...html.matchAll(/\/data\/([0-9]+)\/(fileData|openapi)\.do/g)]
        .slice(0, 20)
        .map((m) => ({ datasetId: m[1], kind: m[2], url: `https://www.data.go.kr${m[0]}` }));
      results.push({ ...query, status: "ok", foundCount: links.length, links });
    } catch (error) {
      results.push({ ...query, status: "failed", error: error.message });
    }
  }
  return results;
}

const COLLECTORS = {
  file: collectFileSource,
  openapi: collectOpenApiSource,
  kosis: collectKosisSource,
  ecos: collectEcosSource,
  seoul: collectSeoulDataSource
};

// 관리자 승인 큐(approved_candidates.json)에서 승인된 후보를 동적 소스 설정으로 변환.
// 관리자 페이지에서 승인 → 다음 배치에서 자동 수집되는 경로.
async function loadApprovedCandidateSources() {
  const path = join(root, "data", "registry", "approved_candidates.json");
  let payload;
  try {
    payload = JSON.parse(await (await import("node:fs/promises")).readFile(path, "utf8"));
  } catch {
    return [];
  }
  const kindToType = { fileData: "file", openapi: "openapi", kosis: "kosis", ecos: "ecos" };
  return (payload.approved ?? []).map((c) => {
    const type = kindToType[c.kind] ?? "file";
    return {
      id: `approved_${c.kind}_${c.dataset_id}`,
      type,
      datasetId: type === "file" || type === "openapi" ? String(c.dataset_id) : undefined,
      tblId: type === "kosis" ? String(c.dataset_id) : undefined,
      provider: c.provider ?? "승인 후보",
      title: c.title ?? `승인 데이터셋 ${c.dataset_id}`,
      category: "관리자 승인 등록",
      apiKeyEnv: type === "openapi" ? "DATA_GO_KR_SERVICE_KEY" : type === "kosis" ? "KOSIS_API_KEY" : undefined,
      endpoint: type === "openapi" ? c.url : undefined,
      targetTable: c.target_table ?? null,
      outputBaseName: `approved_${c.kind}_${c.dataset_id}`,
      sourceUrl: c.url ?? null,
      updateCycle: "—",
      license: "공공데이터 이용허락",
      personalDataSafe: true,
      verified: false,
      notes: `관리자 승인 등록(${c.decided_by ?? "admin"}). 키워드: ${c.keyword ?? "-"}`
    };
  });
}

async function main() {
  await ensureDir(rawDir);
  await ensureDir(catalogDir);

  const approvedSources = await loadApprovedCandidateSources();
  if (approvedSources.length > 0) {
    console.log(`[main] 관리자 승인 후보 ${approvedSources.length}건 동적 수집 포함`);
  }
  const allSources = [...publicDataSources, ...approvedSources];

  const catalog = {
    generatedAt: new Date().toISOString(),
    keysPresent: {
      DATA_GO_KR_SERVICE_KEY: Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
      KOSIS_API_KEY: Boolean(process.env.KOSIS_API_KEY),
      ECOS_API_KEY: Boolean(process.env.ECOS_API_KEY),
      SEOUL_OPENAPI_KEY: Boolean(process.env.SEOUL_OPENAPI_KEY)
    },
    sources: [],
    discovery: await discoverDataGoKr()
  };

  // 승인된 후보를 포함한 전체 소스를 동시성 제한 병렬로 수집.
  const tasks = allSources.map((source) => async () => {
    const collector = COLLECTORS[source.type];
    const registry = {
      id: source.id,
      type: source.type,
      provider: source.provider,
      title: source.title,
      category: source.category,
      targetTable: source.targetTable,
      sourceUrl: source.sourceUrl,
      updateCycle: source.updateCycle,
      license: source.license,
      personalDataSafe: source.personalDataSafe,
      verified: source.verified,
      notes: source.notes
    };
    if (!collector) return { ...registry, result: { status: "unknown_type" } };
    let result;
    try {
      result = await collector(source);
    } catch (error) {
      result = { status: "collector_error", reason: error.message };
    }
    const entry = { ...registry, fetchedAt: new Date().toISOString(), result };
    console.log(`[${source.id}] ${result.status}${result.rowCount ? ` (${result.rowCount} rows)` : ""}`);
    return entry;
  });

  catalog.sources = await runConcurrent(tasks, COLLECT_CONCURRENCY);

  const catalogPath = join(catalogDir, `fetch_catalog_${todayStamp()}.json`);
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  await writeFile(join(catalogDir, "latest_fetch_catalog.json"), JSON.stringify(catalog, null, 2), "utf8");

  console.log(JSON.stringify({ ok: true, catalogPath, sourceCount: catalog.sources.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
