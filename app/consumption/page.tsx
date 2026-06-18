import {
  BopTransferIncomeChart,
  BopTransferMonthlyChart,
  ExchangeRateChart
} from "@/components/charts/EcosCharts";
import {
  DutyFreeNationalityChart,
  ForeignLandNationalityChart
} from "@/components/charts/ForeignConsumptionCharts";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { formatNumber } from "@/lib/utils/format";
import {
  realBopTransferIncome,
  realDutyFreeSales,
  realExchangeRate,
  realForeignLandAcquisition
} from "@/lib/data/generated/realData";

export default function ConsumptionPage() {
  // 한국은행 ECOS (이전소득수지·환율)
  const bopHasData = realBopTransferIncome.annual.length > 0;
  const fxHasData = realExchangeRate.monthly.length > 0;
  const fxLatest = realExchangeRate.latest as {
    usd?: { date: string; value: number } | null;
    cny?: { date: string; value: number } | null;
    jpy?: { date: string; value: number } | null;
    eur?: { date: string; value: number } | null;
  };
  const fxDate = fxLatest.usd?.date ?? "";
  const fxDateLabel = fxDate.length === 8 ? `${fxDate.slice(0, 4)}.${fxDate.slice(4, 6)}.${fxDate.slice(6, 8)}` : "";
  const fxCards = [
    { label: "원/달러", v: fxLatest.usd?.value },
    { label: "원/위안", v: fxLatest.cny?.value },
    { label: "원/엔(100엔)", v: fxLatest.jpy?.value },
    { label: "원/유로", v: fxLatest.eur?.value }
  ];

  // 외국인 소비·거래 (data.go.kr file)
  const dutyFreeHasData = realDutyFreeSales.byNationality.length > 0;
  const landHasData = realForeignLandAcquisition.byNationality.length > 0;
  const dutyFreeTop = dutyFreeHasData ? realDutyFreeSales.byNationality[0] : null;
  const landTop = landHasData ? realForeignLandAcquisition.byNationality[0] : null;

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="분석 데이터 활용"
        title="외국인 소비·금융거래"
        description="면세점 국적별 소비·외국인 부동산 취득·본국송금(이전소득수지)·환율 데이터를 결합해 외국인 결제·환전·자산관리 금융 수요를 분석합니다."
      />

      {/* ── 거시 금융지표 (한국은행 ECOS): 이전소득수지·환율 ─────────── */}
      <section id="macro" className="scroll-mt-20">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            거시 금융지표 — 본국송금·환율
          </h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            한국은행 ECOS · 실시간
          </span>
        </div>

        {/* 최신 환율 카드 */}
        {fxHasData && (
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fxCards.map((c) => (
              <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{c.label}</p>
                <p className="mt-1 text-xl font-black text-slate-900">
                  {c.v != null ? c.v.toLocaleString() : "-"}
                  <span className="ml-1 text-xs font-medium text-slate-400">원</span>
                </p>
                {fxDateLabel && <p className="mt-0.5 text-[11px] text-slate-400">{fxDateLabel} 매매기준율</p>}
              </div>
            ))}
          </div>
        )}

        {/* (1) 이전소득수지 연도별 + (2) 원/달러 환율 월별 */}
        <div className="two-column mb-5">
          {bopHasData ? (
            <Panel
              title="이전소득수지(본국송금 거시 대리지표)"
              subtitle={`연도별 이전소득수지 · ${realBopTransferIncome.latestYear}년 ${realBopTransferIncome.latestValue?.toLocaleString()} ${realBopTransferIncome.unit}`}
              right={<span className="eyebrow">실데이터 · ECOS</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box">
                <BopTransferIncomeChart />
              </div>
              <div className="border-t border-line px-5 py-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-blue-700">금융 관점:</span> 이전소득수지(개인이전 포함)는
                  외국인 본국송금을 직접 집계하진 않지만 그 거시 흐름의 대리지표입니다. 송금 시장 규모의
                  연도별 추세를 추적해 송금·환전 상품의 시장 성장성을 가늠할 수 있습니다.
                </p>
              </div>
            </Panel>
          ) : (
            <div className="surface p-5 text-sm text-muted">이전소득수지 데이터 수집 대기 중</div>
          )}

          {fxHasData ? (
            <Panel
              title="원/달러 환율 추세(월말, 최근 24개월)"
              subtitle="원/미국달러 매매기준율 월말값"
              right={<span className="eyebrow">실데이터 · ECOS</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box">
                <ExchangeRateChart />
              </div>
              <div className="border-t border-line px-5 py-3">
                <p className="text-xs leading-relaxed text-slate-600">
                  <span className="font-semibold text-rose-700">금융 관점:</span> 환율 급등(원화 약세) 구간은
                  외국인 본국송금·환전 수요가 급증하는 시점입니다. 환율 모니터링을 송금 우대·환율 알림
                  마케팅 타이밍에 직접 연결할 수 있습니다.
                </p>
              </div>
            </Panel>
          ) : (
            <div className="surface p-5 text-sm text-muted">환율 데이터 수집 대기 중</div>
          )}
        </div>

        {/* (3) 이전소득수지 월별 추세 */}
        {realBopTransferIncome.monthly.length > 0 && (
          <Panel
            title="이전소득수지 월별 흐름(최근 36개월)"
            subtitle={`월별 이전소득수지 (${realBopTransferIncome.unit})`}
            right={<span className="eyebrow">실데이터 · ECOS</span>}
            bodyClassName="p-0"
          >
            <div className="chart-box">
              <BopTransferMonthlyChart />
            </div>
            <div className="border-t border-line px-5 py-3">
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-teal-700">금융 관점:</span> 월별 흐름은 계절성(명절·연말
                송금 성수기)을 드러내 송금 캠페인·유동성 운용 계획에 활용할 수 있습니다.
              </p>
            </div>
          </Panel>
        )}

        <p className="mt-3 text-xs text-slate-500">
          데이터 출처: 한국은행 경제통계시스템(ECOS) — 국제수지 이전소득수지(301Y013·ITEM 4B1000), 주요국 대원화환율(731Y001).
          매일 18:30 UTC 수집 배치 완료 시 자동 갱신.
        </p>
      </section>

      {/* ── 외국인 소비·거래 (data.go.kr): 면세점 국적별 매출 · 외국인 토지취득 ───── */}
      {(dutyFreeHasData || landHasData) && (
        <section id="trade" className="scroll-mt-20">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              외국인 소비·거래 — 국적별
            </h2>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
              data.go.kr · 실측 거래
            </span>
          </div>

          <div className="two-column mb-3">
            {dutyFreeHasData ? (
              <Panel
                title="면세점 외국인 국적별 매출"
                subtitle={`JDC 지정면세점 · ${realDutyFreeSales.latestYear}년 · 외국인 합계 ${formatNumber(Math.round(realDutyFreeSales.foreignTotal / 1e8))}억원`}
                right={<span className="eyebrow">실데이터 · data.go.kr</span>}
                bodyClassName="p-0"
              >
                <div className="chart-box">
                  <DutyFreeNationalityChart />
                </div>
                <div className="border-t border-line px-5 py-3">
                  <p className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-rose-700">금융 관점:</span> 국적별 면세 소비는
                    카드결제·환전 수요의 직접 신호입니다.
                    {dutyFreeTop ? (
                      <>
                        {" "}최대 소비국 <span className="font-semibold text-slate-800">{dutyFreeTop.nationality}</span>
                        ({formatNumber(Math.round(dutyFreeTop.value / 1e8))}억원)을 중심으로 국적별 결제·환율 우대
                        프로모션을 설계할 수 있습니다.
                      </>
                    ) : null}
                  </p>
                </div>
              </Panel>
            ) : (
              <div className="surface p-5 text-sm text-muted">면세점 매출 데이터 수집 대기 중</div>
            )}

            {landHasData ? (
              <Panel
                title="외국인 국적별 토지 취득금액"
                subtitle={`제주특별자치도 · ${realForeignLandAcquisition.latestYear}년 · 총 ${formatNumber(Math.round(realForeignLandAcquisition.total / 100))}억원`}
                right={<span className="eyebrow">실데이터 · data.go.kr</span>}
                bodyClassName="p-0"
              >
                <div className="chart-box">
                  <ForeignLandNationalityChart />
                </div>
                <div className="border-t border-line px-5 py-3">
                  <p className="text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-teal-700">금융 관점:</span> 외국인 부동산 취득은
                    주택담보대출·자산관리·법인 금융 수요와 직결됩니다.
                    {landTop ? (
                      <>
                        {" "}최대 취득국 <span className="font-semibold text-slate-800">{landTop.nationality}</span>
                        ({formatNumber(Math.round(landTop.value / 100))}억원)이 압도적이라 해당 국적 타깃 대출·자산관리
                        상품 기회가 큽니다.
                      </>
                    ) : null}
                  </p>
                </div>
              </Panel>
            ) : (
              <div className="surface p-5 text-sm text-muted">외국인 토지취득 데이터 수집 대기 중</div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            데이터 출처: 공공데이터포털(data.go.kr) — JDC지정면세점 국적별 매출(제주국제자유도시개발센터),
            외국인 토지취득현황(제주특별자치도, 유형=국적별). 지역(제주) 표본 한정 — 전국 일반화 시 유의.
          </p>
        </section>
      )}

      <p className="text-[11px] leading-5 text-muted">
        출처: 한국은행 경제통계시스템(ECOS) · 공공데이터포털(data.go.kr). 집계 통계 기반(개인 식별정보 미포함)이며,
        매일 18:30 UTC 수집 배치 완료 시 자동 갱신됩니다.
      </p>
    </div>
  );
}
