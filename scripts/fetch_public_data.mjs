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

const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS ?? 18000);
const FETCH_ATTEMPTS = Number(process.env.FETCH_ATTEMPTS ?? 3);
// 브라우저 User-Agent: 일부 정부 API(KOSIS·data.go.kr)는 봇/비브라우저 UA를 차단한다.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// 네트워크 오류 원인 코드를 추출한다(undici의 'fetch failed'는 error.cause.code에 실제 원인:
// ECONNRESET=연결 리셋(방화벽/차단), ETIMEDOUT/UND_ERR_CONNECT_TIMEOUT=연결 타임아웃,
// ENOTFOUND=DNS 실패, CERT/TLS 관련=인증서 문제). CI 진단을 위해 reason에 노출한다.
function errCode(error) {
  return (
    error?.cause?.code ||
    error?.code ||
    (error?.name === "AbortError" ? "ABORT_TIMEOUT" : "") ||
    (error?.cause?.message ? String(error.cause.message).slice(0, 40) : "")
  );
}

// 일시적 네트워크 오류에 한해 지수 백오프로 재시도한다.
// last-good 보존이 데이터 회귀를 막으므로 3회까지 허용하되, 전면 장애 시 15분 캡을
// 넘지 않도록 타임아웃·횟수를 제한한다. 5xx(서버 일시 오류)도 재시도 대상에 포함.
async function fetchWithRetry(url, options = {}, attempts = FETCH_ATTEMPTS) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "*/*",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          ...(options.headers ?? {})
        }
      });
      clearTimeout(timeout);
      if (res.status >= 500 && attempt < attempts) {
        await sleep(1500 * 2 ** (attempt - 1));
        continue;
      }
      return res;
    } catch (error) {
      clearTimeout(timeout);
      const code = errCode(error);
      lastError = code ? new Error(`${error.message} [${code}]`) : error;
      if (attempt < attempts) {
        await sleep(1500 * 2 ** (attempt - 1));
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
    headerLine: download.ok ? (download.headerLine ?? null) : null,
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

// KOSIS는 일부 응답에서 키에 따옴표를 붙이지 않는 비표준 JSON을 반환한다(JSON.parse 실패).
// 표준 파싱을 먼저 시도하고, 실패하면 키에 따옴표를 보강해 재파싱한다.
function parseKosisJson(text) {
  const t = (text ?? "").replace(/^﻿/, "");
  try { return JSON.parse(t); } catch {}
  try { return JSON.parse(t.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')); } catch {}
  return null;
}

// getMeta(type=ITM) 한 번으로 항목(itmId)과 분류(objL) 코드를 함께 가져온다.
// 응답에는 OBJ_ID="ITEM" 행(항목)과 OBJ_ID=<분류ID> 행(분류값 코드)이 섞여 있다.
// getMeta(type=OBJ)는 다수 테이블에서 err 30("데이터 없음")을 내므로 ITM 응답에서 분류를 추출한다.
// 반환: { itemId, objLevels: [["1110100A00", ...], ...] } (objLevels는 OBJ_ID 등장 순서).
async function fetchKosisMeta(source, apiKey, attempts) {
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
    const body = parseKosisJson(await res.text());
    if (!Array.isArray(body)) {
      attempts.push({ step: "getMeta(ITM)", error: body?.errMsg ?? body?.err ?? "parse failed" });
      return null;
    }
    const itemIds = [];
    const levels = new Map();   // OBJ_ID -> [codes], 삽입 순서 = objL 순서
    for (const r of body) {
      const objId = r.OBJ_ID ?? r.obj_id;
      const itmId = r.ITM_ID ?? r.itmId ?? r.itm_id;
      if (!objId || !itmId) continue;
      if (objId === "ITEM") itemIds.push(itmId);
      else { if (!levels.has(objId)) levels.set(objId, []); const arr = levels.get(objId); if (!arr.includes(itmId)) arr.push(itmId); }  // objL 코드 중복 제거(일부 표는 getMeta가 중복 반환 → 셀 2배 방지)
    }
    if (itemIds.length === 0 && levels.size === 0) return null;
    return { itemId: itemIds.join("+") || null, objLevels: [...levels.values()] };
  } catch (error) {
    attempts.push({ step: "getMeta(ITM)", error: error.message });
    return null;
  }
}

// 해당 테이블의 최신 발행 연도를 getMeta(type=PRD)로 조회한다(END_PRD_DE 최대값).
// 과거 metaData.do?method=periodData는 HTML을 반환해 항상 실패했다.
async function getKosisLatestPeriod(apiKey, orgId, tblId) {
  try {
    const url = new URL(KOSIS_META_ENDPOINT);
    url.searchParams.set("method", "getMeta");
    url.searchParams.set("type", "PRD");
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("tblId", tblId);
    url.searchParams.set("format", "json");
    const res = await fetchWithRetry(url, {}, 2);
    if (!res.ok) return null;
    const body = parseKosisJson(await res.text());
    if (!Array.isArray(body) || body.length === 0) return null;
    // END_PRD_DE(없으면 PRD_DE) 내림차순 → 최신 발행 기간.
    const ends = body
      .map((r) => r.END_PRD_DE ?? r.end_prd_de ?? r.PRD_DE ?? "")
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    return ends[0] ?? null;
  } catch {
    return null;
  }
}

const KOSIS_CELL_LIMIT = 38000;       // KOSIS 응답 셀 상한(40,000)의 안전 마진
const KOSIS_OBJ_URL_LIMIT = 6000;     // objL 파라미터 총 길이 상한(HTTP 414 방지)
const KOSIS_MAX_PAGES = 40;           // 페이지네이션 청크 상한(런어웨이 방지)

// 분류 코드 배열을 'code+code+...' 길이가 budgetChars 이하가 되도록 청크 분할(순수 함수, 오프라인 검증 가능).
function splitCodesByBudget(codes, budgetChars) {
  const chunks = [];
  let cur = [];
  let curLen = 0;
  for (const c of codes) {
    const add = String(c).length + 1; // 코드 + '+'
    if (cur.length > 0 && curLen + add > budgetChars) {
      chunks.push(cur);
      cur = [];
      curLen = 0;
    }
    cur.push(c);
    curLen += add;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

// objL 코드가 URL/셀 한도를 넘는 표(읍면동 등)를 가장 큰 분류 레벨 기준으로 청크 분할해 여러 번 호출 후 병합.
// 셀 폭증 방지로 최신 1개 기간만 조회한다. (skipped_too_large 였던 경로 전용 — 기존 동작 경로엔 영향 없음)
async function collectKosisPaginated(source, apiKey, { itmId, objLevels, attempts, requestUrls }) {
  const sizes = objLevels.map((lv) => lv.length);
  const bi = sizes.indexOf(Math.max(...sizes)); // 가장 큰 분류 레벨
  const otherProduct = objLevels.reduce((a, lv, i) => (i === bi ? a : a * Math.max(lv.length, 1)), 1);
  const otherLen = objLevels.reduce((a, lv, i) => (i === bi ? a : a + lv.join("+").length + 8), 0);
  const urlBudget = Math.max(200, KOSIS_OBJ_URL_LIMIT - otherLen);
  const cellBudgetCodes = Math.max(1, Math.floor(KOSIS_CELL_LIMIT / Math.max(otherProduct, 1)));

  // URL 길이 기준 청크 → 셀 한도 기준으로 더 잘게.
  let chunks = splitCodesByBudget(objLevels[bi], urlBudget);
  chunks = chunks.flatMap((ch) =>
    ch.length > cellBudgetCodes
      ? Array.from({ length: Math.ceil(ch.length / cellBudgetCodes) }, (_, k) =>
          ch.slice(k * cellBudgetCodes, (k + 1) * cellBudgetCodes))
      : [ch]
  );

  if (chunks.length > KOSIS_MAX_PAGES) {
    return {
      status: "skipped_too_large", requestUrls, attempts,
      reason: `페이지네이션 청크 ${chunks.length} > 상한 ${KOSIS_MAX_PAGES} — 추가 분할 필요.`
    };
  }

  const latestPeriod = await getKosisLatestPeriod(apiKey, source.orgId, source.tblId);
  const endYear = Number(String(latestPeriod ?? "").slice(0, 4)) || (new Date().getFullYear() - 1);

  const merged = [];
  for (let p = 0; p < chunks.length; p += 1) {
    const dataUrl = new URL(source.dataEndpoint ?? KOSIS_DATA_ENDPOINT);
    dataUrl.searchParams.set("method", "getList");
    dataUrl.searchParams.set("apiKey", apiKey);
    dataUrl.searchParams.set("orgId", source.orgId);
    dataUrl.searchParams.set("tblId", source.tblId);
    dataUrl.searchParams.set("itmId", itmId);
    objLevels.forEach((codes, i) =>
      dataUrl.searchParams.set(`objL${i + 1}`, (i === bi ? chunks[p] : codes).join("+")));
    dataUrl.searchParams.set("format", "json");
    dataUrl.searchParams.set("jsonVD", "Y");
    dataUrl.searchParams.set("prdSe", source.params?.prdSe ?? "Y");
    dataUrl.searchParams.set("startPrdDe", String(endYear));
    dataUrl.searchParams.set("endPrdDe", String(endYear));
    const safe = maskUrl(dataUrl, apiKey);
    if (p < 3) requestUrls.push(safe);
    try {
      const res = await fetchWithRetry(dataUrl);
      attempts.push({ step: `page ${p + 1}/${chunks.length}`, url: safe, status: res.status });
      if (!res.ok) continue;
      const body = parseKosisJson(await res.text());
      if (body == null || (!Array.isArray(body) && (body.err || body.errMsg))) continue;
      merged.push(...(Array.isArray(body) ? body : extractItems(body)));
    } catch (error) {
      attempts.push({ step: `page ${p + 1}`, error: error.message });
    }
  }

  if (merged.length === 0) {
    return { status: "no_data", requestUrls, attempts, reason: "페이지네이션 0행" };
  }
  const fileName = `${source.outputBaseName}_${todayStamp()}.json`;
  await writeFile(join(rawDir, fileName), JSON.stringify(merged, null, 2), "utf8");
  return {
    status: "downloaded", rowCount: merged.length, savedFile: fileName, requestUrls, attempts,
    itmIdSource: "getMeta", detectedLatestPeriod: latestPeriod ?? null,
    paginated: chunks.length, reason: `페이지네이션 ${chunks.length}회 병합`
  };
}

async function collectKosisSource(source) {
  const apiKey = process.env[source.apiKeyEnv];
  if (!apiKey) {
    return { status: "skipped_no_key", reason: `${source.apiKeyEnv} not set`, requestUrls: [source.endpoint] };
  }

  const attempts = [];
  const requestUrls = [];

  // getMeta(ITM) 한 번으로 실제 itmId(항목) + 분류(objL) 코드를 가져온다.
  // 핵심: itmId=ALL/objL=ALL 은 다수 테이블에서 "objL 누락"(err 20) → 실제 코드를 줘야 한다.
  const meta = await fetchKosisMeta(source, apiKey, attempts);
  const itmId = meta?.itemId ?? source.params?.itmId ?? "ALL";
  const objLevels = meta?.objLevels ?? [];

  // objL 파라미터: 실제 분류 코드(있으면) → 없으면 source.params/ALL.
  const objParams = {};
  if (objLevels.length > 0) {
    objLevels.forEach((codes, i) => { objParams[`objL${i + 1}`] = codes.join("+"); });
  } else {
    objParams.objL1 = source.params?.objL1 ?? "ALL";
    for (let lvl = 2; lvl <= 8; lvl += 1) {
      const v = source.params?.[`objL${lvl}`];
      if (v != null && v !== "") objParams[`objL${lvl}`] = v;
    }
  }

  // URL 길이 가드: 분류 코드가 너무 많으면(읍면동 등) HTTP 414가 나므로 페이지네이션으로 분할 수집한다.
  const objLen = Object.values(objParams).join("&").length;
  if (objLen > KOSIS_OBJ_URL_LIMIT) {
    if (objLevels.length > 0) {
      return await collectKosisPaginated(source, apiKey, { itmId, objLevels, attempts, requestUrls });
    }
    return {
      status: "skipped_too_large", requestUrls, attempts,
      reason: `분류 코드 과다(objL ${objLen}자) — objLevels 메타 없음(ALL 폴백)이라 분할 불가.`
    };
  }

  // 셀 제한(40,000) 안에서 요청 기간 수를 정한다. cellsPerPeriod = 각 분류 레벨 코드 수의 곱.
  const cellsPerPeriod = objLevels.length > 0
    ? objLevels.reduce((a, lv) => a * Math.max(lv.length, 1), 1)
    : 1;
  const maxPeriods = Math.max(1, Math.floor(KOSIS_CELL_LIMIT / Math.max(cellsPerPeriod, 1)));

  // 최신 발행 기간(연도) → 종료 연도. 시작 연도는 셀 제한 내 기간 수만큼 거슬러 올라간다.
  const latestPeriod = await getKosisLatestPeriod(apiKey, source.orgId, source.tblId);
  const endYear = Number(String(latestPeriod ?? "").slice(0, 4)) || (new Date().getFullYear() - 1);
  const wantPeriods = Number(source.params?.newEstPrdCnt)
    || (source.params?.startPrdDe ? endYear - Number(source.params.startPrdDe) + 1 : 10);
  const periods = Math.max(1, Math.min(wantPeriods || 10, maxPeriods));
  const startYear = endYear - periods + 1;

  // 데이터 조회: 항상 Param 엔드포인트(statisticsParameterData.do) + 실제 itmId/objL.
  const dataUrl = new URL(source.dataEndpoint ?? KOSIS_DATA_ENDPOINT);
  dataUrl.searchParams.set("method", "getList");
  dataUrl.searchParams.set("apiKey", apiKey);
  dataUrl.searchParams.set("orgId", source.orgId);
  dataUrl.searchParams.set("tblId", source.tblId);
  dataUrl.searchParams.set("itmId", itmId);
  for (const [k, v] of Object.entries(objParams)) dataUrl.searchParams.set(k, v);
  dataUrl.searchParams.set("format", "json");
  dataUrl.searchParams.set("jsonVD", "Y");
  dataUrl.searchParams.set("prdSe", source.params?.prdSe ?? "Y");
  dataUrl.searchParams.set("startPrdDe", String(startYear));
  dataUrl.searchParams.set("endPrdDe", String(endYear));

  const safeDataUrl = maskUrl(dataUrl, apiKey);
  requestUrls.push(safeDataUrl);

  try {
    const res = await fetchWithRetry(dataUrl);
    attempts.push({ step: "statisticsData", url: safeDataUrl, status: res.status });
    if (!res.ok) {
      return { status: "request_failed", requestUrls, attempts, reason: `${res.status} ${res.statusText}` };
    }
    const body = parseKosisJson(await res.text());
    if (body == null) {
      return { status: "non_json_response", requestUrls, attempts, reason: "parse failed" };
    }
    if (!Array.isArray(body) && (body.err || body.errMsg)) {
      return { status: "api_error", requestUrls, attempts, reason: body.errMsg ?? body.err };
    }
    const items = Array.isArray(body) ? body : extractItems(body);
    if (items.length === 0) {
      return { status: "no_data", requestUrls, attempts, reason: "0 rows" };
    }
    const fileName = `${source.outputBaseName}_${todayStamp()}.json`;
    await writeFile(join(rawDir, fileName), JSON.stringify(items, null, 2), "utf8");
    return {
      status: "downloaded",
      rowCount: items.length,
      savedFile: fileName,
      requestUrls,
      attempts,
      itmIdSource: meta?.itemId ? "getMeta" : "fallback",
      detectedLatestPeriod: latestPeriod ?? null,
      cellsPerPeriod,
      periods
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

// 검색 결과 HTML의 앵커에서 datasetId·kind·title 추출.
// 앵커 내부 텍스트는 "CSV 기관_데이터명" 형태(선두 포맷 배지 제거).
function parseDiscoveryLinks(html) {
  const re = /<a [^>]*href="\/data\/([0-9]+)\/(fileData|openapi)\.do"[^>]*>([\s\S]*?)<\/a>/g;
  const seen = new Set();
  const links = [];
  for (const m of html.matchAll(re)) {
    const datasetId = m[1];
    const kind = m[2];
    const key = `${datasetId}:${kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let title = m[3]
      .replace(/<\/?(?:em|strong|b|mark|span)[^>]*>/gi, "") // 검색어 하이라이트 태그는 공백 없이 제거
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^(?:CSV|PDF|HWPX?|XLSX?|XLS|XML|JSON|ZIP|TXT|DOCX?|API|LINK|SHP|GEOJSON|\+|\s)+/i, "")
      .trim();
    links.push({ datasetId, kind, url: `https://www.data.go.kr/data/${datasetId}/${kind}.do`, title: title || null });
    if (links.length >= 20) break;
  }
  return links;
}

async function discoverDataGoKr() {
  const results = [];
  for (const query of discoveryQueries) {
    const url = `https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=${encodeURIComponent(query.keyword)}`;
    try {
      const html = await fetchText(url);
      const links = parseDiscoveryLinks(html);
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
