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

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
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
        await sleep(1500 * attempt);
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
    return {
      source,
      detailUrl,
      status: "metadata_missing",
      reason: "Could not find publicDataDetailPk in detail page"
    };
  }

  const metaUrl = new URL(
    "https://www.data.go.kr/tcs/dss/selectFileDataDownload.do"
  );
  metaUrl.searchParams.set("publicDataPk", source.datasetId);
  metaUrl.searchParams.set("publicDataDetailPk", detailPk);
  metaUrl.searchParams.set("dataSetFileDetailInfo", "1");

  const res = await fetchWithRetry(metaUrl);
  if (!res.ok) {
    return {
      source,
      detailUrl,
      detailPk,
      status: "metadata_request_failed",
      reason: `${res.status} ${res.statusText}`
    };
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
    dataName: fileInfo.dataNm ?? source.title,
    rawMeta: meta
  };
}

function candidateDownloadUrls(meta) {
  const urls = [];
  if (meta.atchFileId && meta.fileDetailSn) {
    urls.push(
      `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${encodeURIComponent(
        meta.atchFileId
      )}&fileDetailSn=${encodeURIComponent(meta.fileDetailSn)}`
    );
    urls.push(
      `https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=${encodeURIComponent(
        meta.atchFileId
      )}&fileDetailSn=${encodeURIComponent(meta.fileDetailSn)}&insertDataPrcus=N`
    );
  }
  if (meta.detailPk) {
    urls.push(
      `https://www.data.go.kr/download/${encodeURIComponent(
        meta.detailPk
      )}/fileData.do?publicDataHistSn=1`
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
      const res = await fetchWithRetry(url, {
        redirect: "follow",
        headers: {
          Referer: meta.detailUrl
        }
      });
      attempts.push({ url, status: res.status, contentType: res.headers.get("content-type") });
      if (!res.ok || !res.body) continue;

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/html")) {
        const text = await res.text();
        if (text.includes("로그인") || text.includes("에러")) {
          continue;
        }
        await writeFile(target, text, "utf8");
      } else {
        await pipeline(Readable.fromWeb(res.body), createWriteStream(target));
      }

      return {
        ok: true,
        path: target,
        fileName,
        url,
        attempts
      };
    } catch (error) {
      attempts.push({ url, error: error.message });
    }
  }

  return {
    ok: false,
    attempts,
    reason: "All candidate download URLs failed"
  };
}

async function findCachedRaw(source) {
  const files = await readdir(rawDir).catch(() => []);
  return files
    .filter((file) => file.startsWith(source.outputBaseName))
    .sort()
    .at(-1) ?? null;
}

async function discoverDataGoKr() {
  const results = [];
  for (const query of discoveryQueries) {
    const url = `https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=${encodeURIComponent(
      query.keyword
    )}`;
    try {
      const html = await fetchText(url);
      const links = [
        ...html.matchAll(/\/data\/([0-9]+)\/(fileData|openapi)\.do/g)
      ]
        .slice(0, 20)
        .map((match) => ({
          datasetId: match[1],
          kind: match[2],
          url: `https://www.data.go.kr${match[0]}`
        }));
      results.push({ ...query, status: "ok", links });
    } catch (error) {
      results.push({ ...query, status: "failed", error: error.message });
    }
  }
  return results;
}

async function main() {
  await ensureDir(rawDir);
  await ensureDir(catalogDir);

  const catalog = {
    generatedAt: new Date().toISOString(),
    sources: [],
    discovery: await discoverDataGoKr()
  };

  for (const source of publicDataSources) {
    let meta;
    try {
      meta = await getFileMeta(source);
    } catch (error) {
      catalog.sources.push({
        source,
        status: "metadata_failed_using_cached_raw",
        cachedRawFile: await findCachedRaw(source),
        reason: error.message
      });
      continue;
    }
    const metaPath = join(catalogDir, `${source.id}.metadata.json`);
    await ensureDir(dirname(metaPath));
    await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

    if (!meta.atchFileId) {
      catalog.sources.push({
        source,
        status: "metadata_without_file",
        metaPath
      });
      continue;
    }

    const download = await downloadFile(meta);
    catalog.sources.push({
      source,
      status: download.ok ? "downloaded" : "download_failed",
      metaPath,
      download
    });
  }

  const catalogPath = join(catalogDir, `fetch_catalog_${todayStamp()}.json`);
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2), "utf8");
  await writeFile(
    join(catalogDir, "latest_fetch_catalog.json"),
    JSON.stringify(catalog, null, 2),
    "utf8"
  );

  console.log(JSON.stringify({ ok: true, catalogPath }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
