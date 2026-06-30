import { pageMetadata } from "@/lib/seo";
import { BarChart2 } from "lucide-react";
import {
  econActivityData,
  hasEconActivity,
  hasHealthInsurance,
  hasMulticulturalFamily,
  healthInsuranceData,
  multiculturalFamilyData,
  multiculturalFamilySummary
} from "@/lib/data/mockData";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { formatNumber } from "@/lib/utils/format";
import {
  ForeignWageDistributionChart,
  ForeignWageTrendChart
} from "@/components/charts/ForeignWageChart";
import {
  EpsByCountryChart,
  EpsByIndustryChart,
  EpsTrendChart
} from "@/components/charts/EpsIntroductionChart";
import {
  ForeignContractChart,
  contractSummary
} from "@/components/charts/ForeignContractChart";
import {
  AgeActivityChart,
  EmploymentStatusChart,
  IndustryEmploymentChart
} from "@/components/charts/ForeignEmploymentCharts";
import {
  realEpsIntroduction,
  realForeignAgeActivity,
  realForeignEmploymentStatus,
  realForeignIndustry,
  realForeignWage
} from "@/lib/data/generated/realData";


export const metadata = pageMetadata("/economy");

export default function EconomyPage() {
  // ── 실데이터(KOSIS) 파생 요약값 ─────────────────────────────────────────
  const wageHasData = realForeignWage.distribution.length > 0;
  const epsHasData = realEpsIntroduction.byCountry.length > 0;
  const contractHasData = contractSummary.fixedTerm + contractSummary.openTerm > 0;

  const epsTopCountry = epsHasData
    ? [...realEpsIntroduction.byCountry].sort((a, b) => b.value - a.value)[0]
    : null;
  const epsLatest = realEpsIntroduction.trend.length
    ? [...realEpsIntroduction.trend].sort((a, b) => a.year - b.year).at(-1)
    : null;
  const epsTotal = realEpsIntroduction.byCountry.reduce((s, r) => s + r.value, 0);
  const contractTotal = contractSummary.fixedTerm + contractSummary.openTerm;
  const fixedShare = contractTotal > 0 ? Math.round((contractSummary.fixedTerm / contractTotal) * 100) : 0;

  // 종사상지위·산업·연령 (신규 KOSIS 이민자체류실태조사)
  const empStatusHasData = realForeignEmploymentStatus.distribution.length > 0;
  const industryHasData = realForeignIndustry.distribution.length > 0;
  const ageHasData = realForeignAgeActivity.distribution.length > 0;
  const topIndustry = industryHasData
    ? [...realForeignIndustry.distribution].sort((a, b) => b.value - a.value)[0]
    : null;
  const financeIndustry = realForeignIndustry.distribution.find((d) => d.industry.includes("금융")) ?? null;
  const peakAge = ageHasData
    ? [...realForeignAgeActivity.distribution].sort((a, b) => (b.employed ?? 0) - (a.employed ?? 0))[0]
    : null;

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="분석 데이터 활용"
        title="외국인 경제활동·소득"
        description="외국인의 임금·고용·산업·연령·고용허가제(EPS)·건강보험 데이터를 분석해 소득 안정성과 금융 수요 구조를 진단합니다."
      />

      {/* ── 외국인 경제활동인구 (KOSIS 수집 시 표시) ──────────── */}
      {hasEconActivity && (() => {
        // 경제활동인구 표(천명 단위)만 사용 — EPS 산업표(명 단위) 등 타 소스·합계행을 제외해 단위 혼합 제거.
        const ECON_SRC = "kosis_foreigner_economic_activity";
        const econRows = econActivityData.filter((r) => r.sourceId === ECON_SRC && r.category !== "계");
        const periods = [...new Set(econRows.map((r) => r.period))].sort().reverse();
        const latestPeriod = periods[0] ?? "";
        // 같은 체류자격이 ITM(15세이상인구·경활인구·취업자·참가율…)별로 중복 → 첫 측정값(15세이상 인구·천명)만 사용.
        const byCat = new Map<string, (typeof econRows)[number]>();
        for (const r of econRows.filter((r) => r.period === latestPeriod)) {
          if (!byCat.has(r.category)) byCat.set(r.category, r);
        }
        const latestRows = [...byCat.values()];
        const maxVal = Math.max(...latestRows.map((r) => r.value), 1);
        // 연도별 총계(계 첫-ITM = 15세이상 인구, 천명) 추이.
        const totalByYear = new Map<string, number>();
        for (const r of econActivityData.filter((r) => r.sourceId === ECON_SRC && r.category === "계")) {
          if (!totalByYear.has(r.period)) totalByYear.set(r.period, r.value);
        }
        const econTrend = [...totalByYear.entries()]
          .map(([y, v]) => ({ year: Number(y), value: v }))
          .sort((a, b) => a.year - b.year);
        const econTrendMax = Math.max(...econTrend.map((p) => p.value), 1);
        return (
          <section id="econ-activity" className="scroll-mt-20">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">외국인 경제활동인구</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                KOSIS · {latestPeriod}년
              </span>
            </div>
            <div className="surface p-5">
              <p className="mb-4 text-xs text-muted">{latestRows[0]?.provider} {latestRows[0]?.title} · 체류자격별 15세이상 인구(천명)</p>
              <div className="space-y-2.5">
                {latestRows.sort((a, b) => b.value - a.value).map((row, i) => (
                  <div
                    key={`${row.period}-${row.category}-${i}`}
                    className="flex items-center gap-3"
                    role="img"
                    aria-label={`${row.category}: ${row.value.toLocaleString()}천명`}
                  >
                    <span className="w-20 shrink-0 truncate text-xs text-ink sm:w-36" title={row.category}>{row.category}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{ width: `${Math.round((row.value / maxVal) * 100)}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 whitespace-nowrap text-right font-mono text-xs text-muted">
                        {row.value.toLocaleString()}천명
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {econTrend.length >= 3 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    총계(15세이상 인구) 연도별 추이 · {econTrend[0].year}~{econTrend.at(-1)!.year}
                  </p>
                  <div className="flex items-end gap-1.5" style={{ height: 110 }}>
                    {econTrend.map((p) => {
                      const h = Math.max(4, Math.round((p.value / econTrendMax) * 84));
                      const isLast = p.year === econTrend.at(-1)!.year;
                      return (
                        <div
                          key={p.year}
                          className="flex min-w-[24px] flex-1 flex-col items-center gap-1"
                          role="img"
                          aria-label={`${p.year}년 ${p.value.toLocaleString()}천명`}
                        >
                          <span className="text-[9px] font-semibold text-slate-500">{(p.value / 10).toFixed(0)}만</span>
                          <div className="flex w-full max-w-[34px] items-end" style={{ height: 84 }}>
                            <div className="w-full rounded-t" style={{ height: h, background: isLast ? "#0f766e" : "#94a3b8" }} />
                          </div>
                          <span className="text-[9px] text-muted">{String(p.year).slice(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {periods.length > 1 && (
                <p className="mt-3 text-[11px] text-muted">
                  수집 기간: {periods.at(-1)}~{periods[0]}년 · 연도별 데이터 {periods.length}개
                </p>
              )}
            </div>
          </section>
        );
      })()}

      {/* ── 건강보험 외국인 적용인구 (수집 시 표시) ─────────────── */}
      {hasHealthInsurance && (() => {
        const sorted = [...healthInsuranceData].sort((a, b) => b.total - a.total);
        const maxTotal = sorted[0]?.total || 1;
        const grandTotal = sorted.reduce((s, r) => s + r.total, 0);
        const workplaceTotal = sorted.reduce((s, r) => s + r.workplace, 0);
        const regionalTotal = sorted.reduce((s, r) => s + r.regional, 0);
        return (
          <section id="health" className="scroll-mt-20">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">외국인 건강보험 적용인구</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">국민건강보험공단 · 2022</span>
            </div>
            <div className="surface p-5">
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-center">
                <div><p className="text-lg font-black text-ink">{grandTotal.toLocaleString()}</p><p className="text-xs text-muted">전체 적용인원</p></div>
                <div><p className="text-lg font-black" style={{ color: "#0f766e" }}>{workplaceTotal.toLocaleString()}</p><p className="text-xs text-muted">직장가입</p></div>
                <div><p className="text-lg font-black" style={{ color: "#3157a4" }}>{regionalTotal.toLocaleString()}</p><p className="text-xs text-muted">지역가입</p></div>
              </div>
              <div className="space-y-2">
                {sorted.slice(0, 15).map((row) => (
                  <div
                    key={row.region}
                    className="flex items-center gap-3"
                    role="img"
                    aria-label={`${row.region}: 직장가입 ${row.workplace.toLocaleString()}, 지역가입 ${row.regional.toLocaleString()}, 합계 ${row.total.toLocaleString()}명`}
                  >
                    <span className="w-16 shrink-0 truncate text-xs text-ink sm:w-24">{row.region}</span>
                    <div className="flex flex-1 items-center gap-1">
                      <div
                        className="h-2 rounded-l"
                        style={{ width: `${Math.round((row.workplace / maxTotal) * 50)}%`, background: "#0f766e", minWidth: row.workplace > 0 ? 2 : 0 }}
                      />
                      <div
                        className="h-2 rounded-r"
                        style={{ width: `${Math.round((row.regional / maxTotal) * 50)}%`, background: "#3157a4", minWidth: row.regional > 0 ? 2 : 0 }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-xs text-muted">{row.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── 다문화가족 현황 (수집 시 표시) ──────────────────────── */}
      {hasMulticulturalFamily && (() => {
        const sorted = [...multiculturalFamilyData].sort((a, b) => b.total - a.total);
        const maxTotal = sorted[0]?.total || 1;
        return (
          <section id="welfare" className="scroll-mt-20">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">다문화가족 현황</h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                여성가족부 · 부산 표본{multiculturalFamilySummary.latestYear ? ` · ${multiculturalFamilySummary.latestYear}` : ""}
              </span>
            </div>
            <div className="surface p-5">
              <p className="mb-3 text-xs text-muted">
                부산광역시 시군구 표본 · 총 다문화가족 {multiculturalFamilySummary.totalCount.toLocaleString()}명 · 결혼이민자·귀화자 가족의 금융 서비스 수요 기반
                <span className="ml-1 text-amber-700">(전국 일반화 시 유의)</span>
              </p>
              <div className="space-y-2">
                {sorted.map((row, i) => (
                  <div
                    key={`${row.region}-${i}`}
                    className="flex items-center gap-3"
                    role="img"
                    aria-label={`${row.region}: ${row.total.toLocaleString()}명`}
                  >
                    <span className="w-20 shrink-0 truncate text-xs text-ink sm:w-32">{row.region}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round((row.total / maxTotal) * 100)}%`, background: "#be123c" }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono text-xs text-muted">{row.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── 실데이터 차트: 소득·도입·계약 (KOSIS) ─────────────────── */}
      <section id="income" className="scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            실데이터 금융 선행지표
          </h2>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
            KOSIS · 실측 통계
          </span>
        </div>

        {/* (1) 외국인 월평균 임금구간 분포 + 연도 추세 */}
        {wageHasData ? (
          <div className="two-column mb-5">
            <Panel
              title="외국인 월평균 임금구간 분포"
              subtitle={`외국인 취업자의 월평균 임금 구간별 규모 · ${realForeignWage.latestYear}년 (단위 ${realForeignWage.unit})`}
              right={<span className="eyebrow">실데이터 · KOSIS</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box">
                <ForeignWageDistributionChart />
              </div>
              <div className="border-t border-line px-5 py-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-teal-700">금융 관점:</span> 소득 구간은
                  급여계좌·신용(카드·대출) 수요의 직접 대리지표입니다. 200~300만원 구간이 최대
                  밀집층으로 급여계좌·체크카드 기본 수요가 집중되며, 300만원 이상 구간은
                  신용카드·소액대출·적금 등 상향 상품의 타깃입니다.
                </p>
              </div>
            </Panel>

            <Panel
              title="외국인 취업자 총계 연도 추세"
              subtitle={`연도별 외국인 취업자 규모 추이 (단위 ${realForeignWage.unit})`}
              right={<span className="eyebrow">실데이터 · KOSIS</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box">
                <ForeignWageTrendChart />
              </div>
              <div className="border-t border-line px-5 py-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-teal-700">금융 관점:</span> 취업자 총계
                  증가는 급여계좌·송금 거래의 전체 풀(pool) 확대를 의미합니다. 최근 연도
                  상승 추세는 신규 계좌·송금 수요의 구조적 성장 신호입니다.
                </p>
              </div>
            </Panel>
          </div>
        ) : (
          <div className="surface mb-5 p-5 text-sm text-muted">임금 분포 데이터 수집 대기 중</div>
        )}

        {/* (2) 고용허가제 E-9 국가별·연도별·업종별 */}
        {epsHasData ? (
          <>
            <div className="two-column mb-5">
              <Panel
                title="고용허가제(E-9) 국가별 도입 Top 10"
                subtitle={`E-9 신규 도입 인원 상위 국가 · ${realEpsIntroduction.latestYear}년 (단위 ${realEpsIntroduction.unit})`}
                right={<span className="eyebrow">실데이터 · KOSIS</span>}
                bodyClassName="p-0"
              >
                <div className="chart-box">
                  <EpsByCountryChart />
                </div>
                <div className="border-t border-line px-5 py-3">
                  <p className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-blue-700">금융 관점:</span> 신규 도입은
                    급여계좌·송금의 선행지표입니다.
                    {epsTopCountry ? (
                      <>
                        {" "}최다 도입국 <span className="font-semibold text-slate-800">{epsTopCountry.country}</span>
                        ({formatNumber(epsTopCountry.value)}명)을 중심으로 본국 수취국 연계 송금
                        파트너십·다국어 급여계좌 온보딩을 우선 설계할 수 있습니다.
                      </>
                    ) : null}
                  </p>
                </div>
              </Panel>

              <Panel
                title="E-9 연도별 도입 합계 추세"
                subtitle={`연도별 E-9 도입 인원 추이 (단위 ${realEpsIntroduction.unit})`}
                right={<span className="eyebrow">실데이터 · KOSIS</span>}
                bodyClassName="p-0"
              >
                <div className="chart-box">
                  <EpsTrendChart />
                </div>
                <div className="border-t border-line px-5 py-3">
                  <p className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-amber-700">금융 관점:</span> 연간 도입
                    규모는 차년도 급여계좌 신규 개설·해외송금 수요의 선행지표입니다.
                    {epsLatest ? (
                      <>
                        {" "}최근({epsLatest.year}년) 도입 {formatNumber(epsLatest.value)}명은
                        그만큼의 신규 급여이체·정기송금 트래픽 유입을 예고합니다.
                      </>
                    ) : null}
                  </p>
                </div>
              </Panel>
            </div>

            <Panel
              title="E-9 업종별 도입 분포"
              subtitle={`도입 업종별 인원 (단위 ${realEpsIntroduction.unit}) · 총 ${formatNumber(epsTotal)}명`}
              right={<span className="eyebrow">실데이터 · KOSIS</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box">
                <EpsByIndustryChart />
              </div>
              <div className="border-t border-line px-5 py-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-blue-700">금융 관점:</span> 제조업 집중은
                  산업단지 밀집 지역의 급여계좌·번들상품(급여계좌+적금+송금) 영업 우선순위를
                  결정합니다. 업종별 평균 임금·계약기간 차이를 신용 한도 정책에 반영할 수 있습니다.
                </p>
              </div>
            </Panel>
          </>
        ) : (
          <div className="surface mb-5 p-5 text-sm text-muted">E-9 도입 데이터 수집 대기 중</div>
        )}

        {/* (3) 외국인 고용계약기간(근로기간 지정 유무) 분포 */}
        {contractHasData ? (
          <Panel
            title="외국인 고용계약기간 분포"
            subtitle={`근로기간 지정 유무 및 기간 구간별 취업자 · ${contractSummary.latestYear}년 (단위 ${contractSummary.unit})`}
            right={<span className="eyebrow">실데이터 · KOSIS</span>}
            bodyClassName="p-0"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 border-b border-line px-5 py-4 text-center">
              <div>
                <p className="text-lg font-black text-ink">{formatNumber(contractTotal)}</p>
                <p className="text-xs text-muted">전체 ({contractSummary.unit})</p>
              </div>
              <div>
                <p className="text-lg font-black" style={{ color: "#0f766e" }}>
                  {formatNumber(contractSummary.fixedTerm)}
                </p>
                <p className="text-xs text-muted">근로기간 정함 ({fixedShare}%)</p>
              </div>
              <div>
                <p className="text-lg font-black" style={{ color: "#be123c" }}>
                  {formatNumber(contractSummary.openTerm)}
                </p>
                <p className="text-xs text-muted">정하지 않음</p>
              </div>
            </div>
            <div className="chart-box">
              <ForeignContractChart />
            </div>
            <div className="border-t border-line px-5 py-3">
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-rose-700">금융 관점:</span> 계약기간은
                신용 리스크·상품 만기 설계의 핵심 축입니다. 근로기간을 정한 비중이 {fixedShare}%로,
                계약기간에 맞춘 정기적금·단기 신용 한도 설정이 가능합니다. 1년 이상 장기 계약층은
                적금·소액대출의 우량 타깃, 1개월 미만·단기층은 급여계좌·송금 중심으로 접근합니다.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="surface p-5 text-sm text-muted">고용계약기간 데이터 수집 대기 중</div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          데이터 출처: KOSIS(국가통계포털) — 외국인 임금구간·고용계약기간(통계청 이민자체류실태·고용조사),
          고용허가제 E-9 국가별·업종별 도입(고용노동부). 매일 01:00 KST 수집 배치 완료 시 자동 갱신.
        </p>
      </section>

      {/* ── 실데이터 차트: 종사상지위·산업·연령 (KOSIS 이민자체류실태조사) ───── */}
      <section id="employment" className="scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            외국인 취업 구조 — 종사상지위·산업·연령
          </h2>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
            KOSIS · 이민자체류실태조사
          </span>
        </div>

        {/* (1) 종사상지위 + (2) 산업별 */}
        <div className="two-column mb-5">
          {empStatusHasData ? (
            <Panel
              title="종사상지위별 외국인 취업자"
              subtitle={`상용·임시·일용·자영업 등 분포 · ${realForeignEmploymentStatus.latestYear}년 (단위 ${realForeignEmploymentStatus.unit})`}
              right={<span className="eyebrow">실데이터 · KOSIS</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box">
                <EmploymentStatusChart />
              </div>
              <div className="border-t border-line px-5 py-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-teal-700">금융 관점:</span> 상용근로자 비중
                  {realForeignEmploymentStatus.regularShare != null ? (
                    <span className="font-semibold text-slate-800"> {realForeignEmploymentStatus.regularShare}%</span>
                  ) : null}
                  은 안정적 급여소득 모집단의 크기를 나타냅니다. 상용직은 신용카드·신용대출·자동이체
                  적금의 우량 타깃이며, 임시·일용·자영업층은 급여계좌·송금 중심으로 접근합니다.
                </p>
              </div>
            </Panel>
          ) : (
            <div className="surface p-5 text-sm text-muted">종사상지위 데이터 수집 대기 중</div>
          )}

          {industryHasData ? (
            <Panel
              title="산업별 외국인 취업자"
              subtitle={`산업 대분류별 취업자 규모 · ${realForeignIndustry.latestYear}년 (단위 ${realForeignIndustry.unit})`}
              right={<span className="eyebrow">실데이터 · KOSIS</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box">
                <IndustryEmploymentChart />
              </div>
              <div className="border-t border-line px-5 py-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-blue-700">금융 관점:</span>{" "}
                  {topIndustry ? (
                    <>
                      <span className="font-semibold text-slate-800">{topIndustry.industry}</span>
                      ({formatNumber(topIndustry.value)}천명) 집중은 산업단지 밀집 지역의 급여계좌·번들
                      영업 우선순위를 결정합니다.{" "}
                    </>
                  ) : null}
                  금융·보험 종사자는 '전기·운수·통신·금융' 분류에 포함되어 보고됩니다
                  {financeIndustry ? ` (${formatNumber(financeIndustry.value)}천명)` : ""}.
                </p>
              </div>
            </Panel>
          ) : (
            <div className="surface p-5 text-sm text-muted">산업별 취업 데이터 수집 대기 중</div>
          )}
        </div>

        {/* (3) 연령대별 경제활동 */}
        {ageHasData ? (
          <Panel
            title="연령대별 외국인 취업자 · 고용률"
            subtitle={`연령계층별 취업자(천명)와 고용률(%) · ${realForeignAgeActivity.latestYear}년`}
            right={<span className="eyebrow">실데이터 · KOSIS</span>}
            bodyClassName="p-0"
          >
            <div className="chart-box">
              <AgeActivityChart />
            </div>
            <div className="border-t border-line px-5 py-3">
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-amber-700">금융 관점:</span> 연령 분포는 생애주기
                금융상품 타깃팅의 축입니다.{" "}
                {peakAge ? (
                  <>
                    취업자가 가장 많은 <span className="font-semibold text-slate-800">{peakAge.ageBand}</span>
                    ({formatNumber(peakAge.employed ?? 0)}천명, 고용률 {peakAge.employmentRate ?? "-"}%)는
                    적금·소액대출·해외송금의 핵심 수요층입니다.{" "}
                  </>
                ) : null}
                30~40대 고소득·고용률 구간은 신용·자산관리 상품, 청년층은 디지털 송금·체크카드 중심으로
                접근할 수 있습니다.
              </p>
            </div>
          </Panel>
        ) : (
          <div className="surface p-5 text-sm text-muted">연령별 경제활동 데이터 수집 대기 중</div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          데이터 출처: KOSIS(국가통계포털) — 통계청 이민자체류실태조사(종사상지위 DT_2FB007F·산업별 취업 DT_2FB021F·
          연령계층별 경제활동 DT_2FA005F). 매일 01:00 KST 수집 배치 완료 시 자동 갱신.
        </p>
      </section>

      {/* ── 출처 안내 ────────────────────────────────────────────── */}
      <p className="text-[11px] leading-5 text-muted">
        <span className="inline-flex items-center gap-1">
          <BarChart2 size={11} className="shrink-0 text-slate-400" />
          출처
        </span>
        : KOSIS(국가통계포털) — 통계청 이민자체류실태조사·외국인고용조사, 고용노동부 고용허가제(EPS) 도입 통계 ·
        국민건강보험공단(NHIS) 외국인 적용인구 · 여성가족부(여가부) 다문화가족 현황. 집계 통계만 사용하며 개인 식별정보를
        포함하지 않습니다.
      </p>
    </div>
  );
}
