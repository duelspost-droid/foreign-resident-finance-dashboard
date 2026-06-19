// 분석용 웨어하우스 스냅샷 빌더.
// 생성된 lib/data/generated/realData.ts 에서 핵심 분석 시계열·분포 export를 추출해
// 제네릭 metric_snapshots 행(batch_date 포함)으로 평탄화 → data/processed/metric_snapshots.json.
// load_supabase.mjs 가 이 파일을 읽어 Supabase에 append(이력 누적)한다.
//
// realData.ts 의 export는 순수 객체/배열 리터럴(+ as const)이라 balanced-parse 후 eval로 안전 추출.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";

const root = process.cwd();
const REAL = join(root, "lib", "data", "generated", "realData.ts");
const OUT = join(root, "data", "processed", "metric_snapshots.json");

// export const NAME = <literal> [as const]; 에서 <literal>만 균형괄호로 추출 후 eval.
function extractExport(src, name) {
  const re = new RegExp("export const " + name + "\\s*(?::[^=]+)?=\\s*");
  const m = re.exec(src);
  if (!m) return null;
  const i = m.index + m[0].length;
  const open = src[i];
  const close = open === "{" ? "}" : open === "[" ? "]" : null;
  if (!close) return null;
  let depth = 0, inStr = false, strCh = "", j = i;
  for (; j < src.length; j++) {
    const c = src[j];
    if (inStr) {
      if (c === "\\") { j++; continue; }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = true; strCh = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) { j++; break; } }
  }
  // eslint-disable-next-line no-eval
  return eval("(" + src.slice(i, j) + ")");
}

let BATCH = "";
const rows = [];

function emit(o) {
  const v = o.value;
  if (typeof v !== "number" || Number.isNaN(v)) return;
  rows.push({
    batch_date: BATCH,
    source: o.source,
    dataset: o.dataset,
    metric: o.metric,
    dims: o.dims || {},
    period: o.period != null ? String(o.period) : null,
    value: v,
    unit: o.unit ?? null
  });
}

// 단일값 분포: dims = (valueKey·periodKey 제외) 나머지 키.
function dist(arr, { dataset, source, metric, unit, periodKey, period, valueKey = "value" }) {
  for (const r of arr || []) {
    if (!r) continue;
    const dims = {};
    for (const k of Object.keys(r)) { if (k === valueKey || k === periodKey) continue; dims[k] = r[k]; }
    emit({ dataset, source, metric, unit, dims, period: periodKey != null ? r[periodKey] : period, value: r[valueKey] });
  }
}

// 다중값 행(한 행에 여러 지표): metric마다 한 행.
function multi(arr, { dataset, source, periodKey, period, dimKeys = [], metrics, unit }) {
  for (const r of arr || []) {
    if (!r) continue;
    const dims = {};
    for (const k of dimKeys) dims[k] = r[k];
    const per = periodKey != null ? r[periodKey] : period;
    for (const [mk, mu] of metrics) emit({ dataset, source, metric: mk, unit: mu ?? unit, dims, period: per, value: r[mk] });
  }
}

const src = await readFile(REAL, "utf8");
const summary = extractExport(src, "realDataSummary");
BATCH = (summary?.generatedAt || new Date().toISOString()).slice(0, 10);

// ── 고용: 종사상지위 ──
{
  const d = extractExport(src, "realForeignEmploymentStatus");
  if (d) {
    dist(d.distribution, { dataset: "employment_status", source: "kosis_immigrant_employment_status", metric: "count", unit: d.unit, period: d.latestYear });
    dist(d.trend, { dataset: "employment_status", source: "kosis_immigrant_employment_status", metric: "employed_total", unit: d.unit, periodKey: "year" });
    for (const [k, mk, mu] of [["regular", "regular_workers", d.unit], ["wageWorkers", "wage_workers", d.unit], ["total", "employed_total_latest", d.unit], ["regularShare", "regular_share_pct", "%"]]) {
      emit({ dataset: "employment_status", source: "kosis_immigrant_employment_status", metric: mk, unit: mu, dims: {}, period: d.latestYear, value: d[k] });
    }
  }
}

// ── 고용: 산업별 ──
{
  const d = extractExport(src, "realForeignIndustry");
  if (d) dist(d.distribution, { dataset: "industry", source: "kosis_immigrant_employment_by_industry", metric: "count", unit: d.unit, period: d.latestYear });
}

// ── 경제활동: 연령대별(다중지표) ──
{
  const d = extractExport(src, "realForeignAgeActivity");
  if (d) multi(d.distribution, {
    dataset: "age_activity", source: "kosis_immigrant_econ_activity_by_age", period: d.latestYear, dimKeys: ["ageBand"],
    metrics: [["employed", d.unit], ["economicallyActive", d.unit], ["participationRate", "%"], ["employmentRate", "%"]]
  });
}

// ── 거시: 이전소득수지(본국송금 대리) 연·월 ──
{
  const d = extractExport(src, "realBopTransferIncome");
  if (d) {
    dist(d.annual, { dataset: "bop_transfer_income", source: "ecos_bop_transfer_income", metric: "transfer_income", unit: d.unit, periodKey: "year" });
    dist(d.monthly, { dataset: "bop_transfer_income", source: "ecos_bop_transfer_monthly", metric: "transfer_income", unit: d.unit, periodKey: "month" });
  }
}

// ── 거시: 환율(월별 4통화 + 최신 일별) ──
{
  const d = extractExport(src, "realExchangeRate");
  if (d) {
    multi(d.monthly, { dataset: "exchange_rate", source: "ecos_exchange_rate_daily", periodKey: "month", metrics: [["usd", "원"], ["cny", "원"], ["jpy", "원"], ["eur", "원"]] });
    if (d.latest) for (const cur of ["usd", "cny", "jpy", "eur"]) {
      const o = d.latest[cur];
      if (o && typeof o.value === "number") emit({ dataset: "exchange_rate", source: "ecos_exchange_rate_daily", metric: cur, unit: "원", dims: { kind: "latest" }, period: o.date, value: o.value });
    }
  }
}

// ── 소비: 면세점 국적별·월별 ──
{
  const d = extractExport(src, "realDutyFreeSales");
  if (d) {
    dist(d.byNationality, { dataset: "duty_free_sales", source: "jdc_dutyfree_sales_by_nationality", metric: "sales", unit: d.unit, period: d.latestYear });
    dist(d.monthly, { dataset: "duty_free_sales", source: "jdc_dutyfree_sales_by_nationality", metric: "sales", unit: d.unit, periodKey: "month" });
    emit({ dataset: "duty_free_sales", source: "jdc_dutyfree_sales_by_nationality", metric: "foreign_total", unit: d.unit, dims: {}, period: d.latestYear, value: d.foreignTotal });
    emit({ dataset: "duty_free_sales", source: "jdc_dutyfree_sales_by_nationality", metric: "internal_total", unit: d.unit, dims: {}, period: d.latestYear, value: d.internalTotal });
  }
}

// ── 부동산: 외국인 토지취득 국적별 ──
{
  const d = extractExport(src, "realForeignLandAcquisition");
  if (d) {
    dist(d.byNationality, { dataset: "land_acquisition", source: "jeju_foreign_land_acquisition", metric: "acquisition", unit: d.unit, period: d.latestYear });
    emit({ dataset: "land_acquisition", source: "jeju_foreign_land_acquisition", metric: "total", unit: d.unit, dims: {}, period: d.latestYear, value: d.total });
  }
}

// ── 유학생 국적 ──
{
  const d = extractExport(src, "realForeignStudentNationality");
  if (d) dist(d.byNationality, { dataset: "student_nationality", source: "foreign_student_nationality", metric: "students", unit: "명", period: d.latestYear });
}

// ── 임금 분포 ──
{
  const d = extractExport(src, "realForeignWage");
  if (d) dist(d.distribution, { dataset: "wage_distribution", source: "kosis_immigrant_wage_distribution", metric: "workers", unit: d.unit, period: d.latestYear });
}

// ── EPS 도입 국가별·연도추세 ──
{
  const d = extractExport(src, "realEpsIntroduction");
  if (d) {
    dist(d.byCountry, { dataset: "eps_introduction", source: "kosis_eps_introduction_by_country", metric: "introduced", unit: d.unit, period: d.latestYear });
    dist(d.trend, { dataset: "eps_introduction", source: "kosis_eps_introduction_by_country", metric: "introduced_total", unit: d.unit, periodKey: "year" });
  }
}

// ── 출력 ──
const datasets = [...new Set(rows.map((r) => r.dataset))].sort();
const payload = { batchDate: BATCH, generatedAt: summary?.generatedAt ?? null, count: rows.length, datasets, rows };
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(payload, null, 2));

console.log(JSON.stringify({ ok: true, batchDate: BATCH, rows: rows.length, datasets }, null, 2));
