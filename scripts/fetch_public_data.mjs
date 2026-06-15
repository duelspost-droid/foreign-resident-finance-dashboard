import { mkdir, readdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { publicDataSources, discoveryQueries } from "./data_sources.mjs";

const root = process.cwd();
const rawDir = join(root, "data", "raw");
const catalogDir = join(root, "data", "catalog");

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function extractDetailPk(html) {
  const match = html.match(
    /fn_fileDataDown\('([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\)/
  );
  return match?.[2] ?? null;
}

async function getFileMeta(source) {
  const detailUrl = `https://www.data.go.kr/data/${source.datasetId}/fileData.do`;
  const html = await fetchText(detailUrl);
  const detailPk = source.detailPk ?? extractDetailPk(html);

  if (!detailPk) {
    return { source, detailUrl, status: "metadata_missing", reason: "publicDataDetailPk not found" };
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
      } else {
        await pipeline(Readable.fromWeb(res.body), createWriteStream(target));
      }
      return { ok: true, path: target, fileName, url, attempts };
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

  // 2단계: statisticsParameterData.do 로 데이터 조회
  const dataUrl = new URL(source.dataEndpoint ?? KOSIS_DATA_ENDPOINT);
  dataUrl.searchParams.set("method", "getList");
  dataUrl.searchParams.set("apiKey", apiKey);
  dataUrl.searchParams.set("orgId", source.orgId);
  dataUrl.searchParams.set("tblId", source.tblId);
  dataUrl.searchParams.set("itmId", itmId);
  // 분류 레벨: objL1~objL8 을 ALL/빈값으로. source.params 가 있으면 우선.
  dataUrl.searchParams.set("objL1", source.params?.objL1 ?? "ALL");
  dataUrl.searchParams.set("objL2", source.params?.objL2 ?? "");
  dataUrl.searchParams.set("objL3", source.params?.objL3 ?? "");
  dataUrl.searchParams.set("format", "json");
  dataUrl.searchParams.set("jsonVD", "Y");
  dataUrl.searchParams.set("prdSe", source.params?.prdSe ?? "Y");
  dataUrl.searchParams.set("startPrdDe", source.params?.startPrdDe ?? "2020");
  dataUrl.searchParams.set("endPrdDe", source.params?.endPrdDe ?? "2024");

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
    return {
      status: "downloaded",
      rowCount: items.length,
      savedFile: fileName,
      requestUrls,
      attempts,
      itmIdSource: metaItmId ? "getMeta" : "fallback"
    };
  } catch (error) {
    return { status: "request_failed", requestUrls, attempts, reason: error.message };
  }
}

// ── 공통 ────────────────────────────────────────────────────────────────────────

async function findCachedRaw(source) {
  const files = await readdir(rawDir).catch(() => []);
  return files.filter((file) => file.startsWith(source.outputBaseName)).sort().at(-1) ?? null;
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
  kosis: collectKosisSource
};

async function main() {
  await ensureDir(rawDir);
  await ensureDir(catalogDir);

  const catalog = {
    generatedAt: new Date().toISOString(),
    keysPresent: {
      DATA_GO_KR_SERVICE_KEY: Boolean(process.env.DATA_GO_KR_SERVICE_KEY),
      KOSIS_API_KEY: Boolean(process.env.KOSIS_API_KEY)
    },
    sources: [],
    discovery: await discoverDataGoKr()
  };

  for (const source of publicDataSources) {
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

    if (!collector) {
      catalog.sources.push({ ...registry, result: { status: "unknown_type" } });
      continue;
    }

    let result;
    try {
      result = await collector(source);
    } catch (error) {
      result = { status: "collector_error", reason: error.message };
    }
    catalog.sources.push({ ...registry, fetchedAt: new Date().toISOString(), result });
    console.log(`[${source.id}] ${result.status}${result.rowCount ? ` (${result.rowCount} rows)` : ""}`);
  }

  const catalogPath = join(catalogDir, `fetch_catalog_${todayStamp()}.json`);
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  await writeFile(join(catalogDir, "latest_fetch_catalog.json"), JSON.stringify(catalog, null, 2), "utf8");

  console.log(JSON.stringify({ ok: true, catalogPath, sourceCount: catalog.sources.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
