import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  Clock,
  CreditCard,
  Database,
  GraduationCap,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";
import {
  dataFreshness,
  marketKpis,
  regionStrategy,
  topNationalities
} from "@/lib/data/financialInsightsData";
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

// ── 유스케이스 카드 (전략 큐레이션 = 정적 콘텐츠) ─────────────────────────────
const USE_CASES = [
  {
    icon: MapPin,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    title: "지역 기반 지점·ATM 배치 전략",
    target: "대상: 시중은행, 인터넷은행",
    desc: "행안부 시군구별 외국인주민 밀도와 금융 기회 점수를 결합해 외국인 인구 고밀도 지역(경기 안산·시흥, 서울 구로·영등포, 경남 창원 등)을 식별합니다. 기회 점수 상위 지역에 다국어 ATM·전담 창구를 우선 배치하면 신규 고객 획득 비용을 낮출 수 있습니다.",
    dataAxes: ["지역별 외국인 밀도 (행안부)", "금융 기회 점수 (이 대시보드)", "기회 점수 상위 지역 순위"],
    actions: ["시군구별 외국인 주민수 히트맵 구축", "금융 인프라 공백 지역 식별", "다국어 서비스 지역 우선순위 결정"]
  },
  {
    icon: Wallet,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "E-9 근로자 급여계좌·적금 패키지",
    target: "대상: 시중은행, 저축은행, 캐피탈",
    desc: "고용허가제(E-9)·방문취업(H-2) 근로자는 사업주가 급여 이체를 위한 계좌 개설을 필요로 합니다. 평균 계약기간 2~4년에 본국 송금 비율이 높아 '급여계좌 + 정기적금 + 해외송금 묶음 상품'이 효과적입니다.",
    dataAxes: ["고용노동부 외국인 고용 현황", "KOSIS 경제활동인구(체류자격별)", "국민연금 외국인 가입자"],
    actions: ["제조업 밀집 산단 지역 우선 영업", "고용주-근로자 동시 가입 패키지 설계", "급여일 맞춤 자동 적금 상품"]
  },
  {
    icon: Send,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "해외 송금 수요 국적별 예측",
    target: "대상: 시중은행, 핀테크, 환전소",
    desc: "국적별 체류 외국인 규모와 한국은행 이전소득수지를 결합하면 국적별 월평균 송금 추정액을 산출할 수 있습니다. 중국·베트남·우즈베키스탄·필리핀 순으로 송금 수요가 높습니다.",
    dataAxes: ["법무부 국적별 체류외국인 현황", "한국은행 이전소득수지", "건강보험 외국인 직장 가입자"],
    actions: ["국적별 수취국 연계 파트너십", "급여일 D+3 알림 기반 환율 우대 프로모션", "앱 다국어 송금 UX 개선"]
  },
  {
    icon: GraduationCap,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    title: "외국인 유학생 전용 금융 패키지",
    target: "대상: 인터넷은행, 시중은행 캠퍼스 지점",
    desc: "교육부·대학알리미 대학별 유학생 데이터로 상위 30개 대학의 수요를 확인합니다. 학기 초(3월·9월) 집중 계좌 개설 수요, 등록금 납부·생활비 송금 등 반복 거래 패턴을 활용해 장기 고객을 확보할 수 있습니다.",
    dataAxes: ["교육부 대학별 외국인 유학생 현황", "대학알리미 고등교육기관 기본현황", "법무부 D-2·D-4 체류자격 통계"],
    actions: ["대학 캠퍼스 내 외국인 전담 부스 운영", "비대면 계좌 개설 + 학생증 연동 서비스", "부모 본국 → 학생 계좌 수취 특화 상품"]
  },
  {
    icon: Users,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    title: "다문화 가족 특화 상품 개발",
    target: "대상: 시중은행, 보험사, 캐피탈",
    desc: "결혼이민(F-6) 비자 외국인은 장기 정주 의향이 높고 한국인 배우자와 공동 가계를 운영합니다. 다문화가족 현황(여성가족부)으로 시군구별 다문화 가구 규모를 파악해 주택담보대출·가족형 예금·자녀 교육비 적금을 타겟팅할 수 있습니다.",
    dataAxes: ["여성가족부 다문화가족 현황", "행안부 외국인주민 현황(유형별)", "KOSIS 시도별 외국인주민 현황"],
    actions: ["다문화 가족 밀집 시군구 우선 영업", "한국어 능숙도 고려한 다국어 금융 교육", "가족 공동 재무 설계 서비스"]
  },
  {
    icon: ShieldCheck,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    title: "체류자격 기반 신용 리스크 모델",
    target: "대상: 캐피탈, 저축은행, 여신금융사",
    desc: "체류자격별 경제활동인구(통계청)·건강보험 가입 유형·국민연금 가입 이력을 결합하면 외국인 고객의 소득 안정성을 간접 측정할 수 있습니다. 영주권(F-5)·장기거주(F-2)는 체류 잔여 기간 리스크가 낮습니다.",
    dataAxes: ["KOSIS 체류자격별 경제활동인구", "건강보험 외국인 직장/지역 가입자", "국민연금 외국인 가입자 현황"],
    actions: ["체류자격별 신용 한도 차등 정책 수립", "비자 갱신 주기 모니터링 연계 알림", "영주권 취득 예정자 신용 등급 전환 프로그램"]
  }
];

// ── 세그먼트 × 금융 상품 매트릭스 (전략 프레임워크 = 정적) ───────────────────────
const SEGMENTS = [
  { visa: "E-9 (고용허가제)", payroll: "●", remit: "●", saving: "●", card: "○", loan: "○", insurance: "○" },
  { visa: "H-2 (방문취업)", payroll: "●", remit: "●", saving: "●", card: "○", loan: "△", insurance: "○" },
  { visa: "D-2 (유학)", payroll: "△", remit: "●", saving: "△", card: "●", loan: "○", insurance: "●" },
  { visa: "D-4 (어학연수)", payroll: "○", remit: "●", saving: "○", card: "●", loan: "○", insurance: "△" },
  { visa: "F-6 (결혼이민)", payroll: "△", remit: "△", saving: "●", card: "●", loan: "●", insurance: "●" },
  { visa: "F-5 (영주)", payroll: "●", remit: "○", saving: "●", card: "●", loan: "●", insurance: "●" },
  { visa: "E-7 (전문취업)", payroll: "●", remit: "●", saving: "●", card: "●", loan: "△", insurance: "●" },
  { visa: "F-2 (장기체류)", payroll: "●", remit: "△", saving: "●", card: "●", loan: "●", insurance: "●" }
];

const DOT_LEGEND = [
  { mark: "●", label: "핵심 수요" },
  { mark: "△", label: "잠재 수요" },
  { mark: "○", label: "낮음" }
];

// ── 데이터 활용 로드맵 (전략 큐레이션 = 정적) ─────────────────────────────────
const ROADMAP = [
  {
    phase: "0–3개월",
    color: "bg-teal-600",
    label: "데이터 기반 지역 분석",
    items: [
      "시군구별 외국인 인구 밀도 히트맵 구축",
      "현재 지점·ATM 커버리지 GAP 분석",
      "E-9·H-2 집중 산단 리스트업",
      "경쟁사 외국인 서비스 현황 스캔"
    ]
  },
  {
    phase: "3–6개월",
    color: "bg-blue-600",
    label: "타겟 세그먼트 상품 론칭",
    items: [
      "E-9 급여계좌 + 해외송금 번들 출시",
      "상위 5개 외국인 유학생 대학 캠퍼스 부스",
      "다국어(베트남어·중국어·영어) 앱 지원",
      "결혼이민(F-6) 가계 금융 패키지 파일럿"
    ]
  },
  {
    phase: "6–12개월",
    color: "bg-violet-600",
    label: "국적별 파트너십 & 리스크 모델",
    items: [
      "베트남·우즈베키스탄 현지 은행 송금 파트너십",
      "체류자격별 신용 행동 데이터 축적",
      "국민연금·건강보험 소득 추정 로직 구현",
      "외국인 전용 간편 신용대출 파일럿 (F-5·F-2 우선)"
    ]
  },
  {
    phase: "12개월+",
    color: "bg-rose-600",
    label: "플랫폼 전환 & 생태계 확장",
    items: [
      "외국인 전용 종합 금융 앱 브랜드화",
      "다문화 가족 전용 자산관리 서비스",
      "귀화·영주권 취득 고객 VIP 전환 프로그램",
      "외국인 고객 LTV 모델 고도화"
    ]
  }
];

const COMPLIANCE_NOTES = [
  "모든 분석은 집계 통계 기반입니다. 외국인등록번호·여권번호·이름 등 개인 식별 정보는 사용하지 않습니다.",
  "체류자격별 금융 서비스 차등 제공 시 국가인권위원회 지침 및 금융소비자보호법 준수가 필요합니다.",
  "외국인 대상 환전·송금 서비스는 외국환거래법 및 특정금융거래정보법(FIU) 규정을 적용합니다.",
  "소수 국적/체류자격 셀은 통계적 식별 가능성을 방지하기 위해 상위 분류 병합 또는 마스킹이 필요합니다."
];

// ── 유틸 ────────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "bg-teal-500" : score >= 70 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-700">{score}</span>
    </div>
  );
}

function DotCell({ mark }: { mark: string }) {
  const color = mark === "●" ? "text-teal-600" : mark === "△" ? "text-amber-500" : "text-slate-300";
  return (
    <td className={`border-b border-slate-100 px-3 py-2 text-center text-lg font-bold ${color}`}>
      {mark}
    </td>
  );
}

function FreshnessTag() {
  const date = new Date(dataFreshness.generatedAt);
  const label = date.toLocaleDateString("ko-KR", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
        <Clock size={13} />
        마지막 수집: {label}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-teal-600">
        <Database size={13} />
        체류 {dataFreshness.statusRowCount.toLocaleString()}행 · 지역 {dataFreshness.regionRowCount.toLocaleString()}행
      </span>
      <span className="flex items-center gap-1.5 text-xs text-teal-600">
        <RefreshCw size={13} />
        매일 18:30 UTC 자동 갱신
      </span>
    </div>
  );
}

export default function FinancialInsightsPage() {
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
        kicker="금융 인사이트"
        title="금융회사 활용 인사이트"
        description="외국인 체류·경제활동 공공 통계를 은행·캐피탈 비즈니스 전략에 활용하는 방법을 분석합니다. 시장 KPI와 지역 순위는 수집 배치 완료 시 자동 갱신됩니다."
      />
      <FreshnessTag />

      {/* ── 시장 규모 KPI ──────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">시장 규모</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {marketKpis.sourceLabel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "총 체류외국인",
              value: formatNumber(marketKpis.totalForeignResidents) + "명",
              delta: marketKpis.totalForeignResidentsYoy + " YoY",
              sub: "법무부 2024.12",
              color: "bg-teal-700",
              icon: Users
            },
            {
              label: "외국인 유학생",
              value: formatNumber(marketKpis.foreignStudents) + "명",
              delta: marketKpis.foreignStudentsYoy + " YoY",
              sub: "D-2·D-4 비자",
              color: "bg-violet-700",
              icon: GraduationCap
            },
            {
              label: "연간 해외 송금 추정",
              value: marketKpis.remittanceEstimateKrw,
              delta: "한국은행 이전소득수지",
              sub: "외국인 본국 송금",
              color: "bg-blue-700",
              icon: Send
            },
            {
              label: "평균 금융 기회 점수",
              value: String(marketKpis.averageOpportunityScore) + " / 100",
              delta: "수집 데이터 기반",
              sub: `${formatNumber(marketKpis.collectedRowCount)}행 집계`,
              color: "bg-amber-700",
              icon: BarChart2
            }
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color} text-white`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-800">{kpi.label}</p>
                <p className="mt-1 text-xs text-teal-600 font-medium">{kpi.delta}</p>
                <p className="mt-0.5 text-xs text-slate-500">{kpi.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 국적별 금융 수요 (실데이터 갱신 시 자동 변경) ────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          주요 국적별 금융 수요
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 text-left font-semibold">국적</th>
                <th className="px-4 py-3 text-left font-semibold">체류 비중</th>
                <th className="px-4 py-3 text-left font-semibold">본국 송금 대상</th>
                <th className="px-4 py-3 text-left font-semibold">핵심 금융 수요</th>
                <th className="px-4 py-3 text-left font-semibold">비중 바</th>
              </tr>
            </thead>
            <tbody>
              {topNationalities.map((nat, i) => (
                <tr key={nat.nationality} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="border-b border-slate-100 px-4 py-2.5 font-semibold text-slate-900">
                    {nat.nationality}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-2.5 text-slate-600">
                    {nat.share}%
                  </td>
                  <td className="border-b border-slate-100 px-4 py-2.5 text-slate-600">
                    {nat.remittanceCountry}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-2.5 text-slate-600">
                    {nat.financialNeed}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${(nat.share / 35) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{nat.residents.toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            데이터 출처: 법무부 체류외국인 현황. 매일 18:30 UTC 수집 배치 완료 시 자동 갱신.
          </p>
        </div>
      </section>

      {/* ── 유스케이스 카드 ────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          주요 비즈니스 유스케이스
        </h2>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <div key={uc.title} className={`rounded-xl border ${uc.border} ${uc.bg} p-5 shadow-sm`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Icon size={18} className={uc.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{uc.title}</h3>
                    <p className="text-xs text-slate-500">{uc.target}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-700">{uc.desc}</p>
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">활용 데이터 축</p>
                  <ul className="space-y-1">
                    {uc.dataAxes.map((ax) => (
                      <li key={ax} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <BarChart2 size={11} className="shrink-0 text-slate-400" />
                        {ax}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 border-t border-white/60 pt-3">
                  <p className="mb-1.5 text-xs font-semibold text-slate-600">추천 액션</p>
                  <ul className="space-y-1">
                    {uc.actions.map((a) => (
                      <li key={a} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <ArrowRight size={11} className="mt-0.5 shrink-0 text-slate-400" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 지역 전략 우선순위 (기회 점수 기반, 자동 갱신) ────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            지역별 금융 전략 우선순위
          </h2>
          <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">
            금융 기회 점수 순 · 자동 갱신
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 text-left font-semibold">순위</th>
                <th className="px-4 py-3 text-left font-semibold">시·도</th>
                <th className="px-4 py-3 text-left font-semibold">핵심 지역</th>
                <th className="px-4 py-3 text-left font-semibold">주요 세그먼트</th>
                <th className="px-4 py-3 text-left font-semibold">추정 외국인</th>
                <th className="px-4 py-3 text-left font-semibold">주력 국적</th>
                <th className="px-4 py-3 text-left font-semibold">전략 방향</th>
                <th className="px-4 py-3 text-left font-semibold">기회 점수</th>
              </tr>
            </thead>
            <tbody>
              {regionStrategy.map((r) => (
                <tr key={r.rank} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-400">#{r.rank}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.sido}</td>
                  <td className="px-4 py-3 text-slate-600">{r.sigungu}</td>
                  <td className="px-4 py-3 text-slate-600">{r.dominant}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {r.residentCount.toLocaleString()}명
                    {r.yoyChangeRate > 0 && (
                      <span className="ml-1 text-teal-600">+{r.yoyChangeRate}%</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.topNationality}</td>
                  <td className="px-4 py-3 text-slate-600">{r.priority}</td>
                  <td className="px-4 py-3">
                    <ScoreBar score={r.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
            기회 점수 = 외국인 규모 × 세그먼트 수요 × 성장률 × 다국적성 가중 합산. 수집 배치 완료 시 자동 재계산.
          </p>
        </div>
      </section>

      {/* ── 세그먼트 × 금융 상품 매트릭스 ──────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          체류자격 × 금융 상품 수요 매트릭스
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-4 py-3 text-left font-semibold">체류자격</th>
                <th className="px-3 py-3 text-center font-semibold">급여계좌</th>
                <th className="px-3 py-3 text-center font-semibold">해외송금</th>
                <th className="px-3 py-3 text-center font-semibold">적금</th>
                <th className="px-3 py-3 text-center font-semibold">체크·신용카드</th>
                <th className="px-3 py-3 text-center font-semibold">대출</th>
                <th className="px-3 py-3 text-center font-semibold">보험·연금</th>
              </tr>
            </thead>
            <tbody>
              {SEGMENTS.map((seg, i) => (
                <tr key={seg.visa} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="border-b border-slate-100 px-4 py-2.5 font-medium text-slate-800">
                    {seg.visa}
                  </td>
                  <DotCell mark={seg.payroll} />
                  <DotCell mark={seg.remit} />
                  <DotCell mark={seg.saving} />
                  <DotCell mark={seg.card} />
                  <DotCell mark={seg.loan} />
                  <DotCell mark={seg.insurance} />
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap gap-4 border-t border-slate-100 bg-slate-50 px-4 py-3">
            {DOT_LEGEND.map((l) => (
              <span key={l.mark} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className={`text-base font-bold ${l.mark === "●" ? "text-teal-600" : l.mark === "△" ? "text-amber-500" : "text-slate-300"}`}>
                  {l.mark}
                </span>
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 데이터 활용 로드맵 ──────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          데이터 활용 로드맵
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROADMAP.map((phase) => (
            <div key={phase.phase} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full ${phase.color} px-3 py-1`}>
                <span className="text-xs font-bold text-white">{phase.phase}</span>
              </div>
              <h3 className="mb-3 text-sm font-bold text-slate-900">{phase.label}</h3>
              <ul className="space-y-2">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <TrendingUp size={11} className="mt-0.5 shrink-0 text-slate-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── 외국인 경제활동인구 (KOSIS 수집 시 표시) ──────────── */}
      {hasEconActivity && (() => {
        const periods = [...new Set(econActivityData.map((r) => r.period))].sort().reverse();
        const latestPeriod = periods[0] ?? "";
        const latestRows = econActivityData.filter((r) => r.period === latestPeriod);
        const maxVal = Math.max(...latestRows.map((r) => r.value), 1);
        return (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">외국인 경제활동인구</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                KOSIS · {latestPeriod}년
              </span>
            </div>
            <div className="surface p-5">
              <p className="mb-4 text-xs text-muted">{latestRows[0]?.provider} {latestRows[0]?.title} · 체류자격별 취업·경제활동 분포</p>
              <div className="space-y-2.5">
                {latestRows.sort((a, b) => b.value - a.value).map((row, i) => (
                  <div key={`${row.period}-${row.category}-${i}`} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 truncate text-xs text-ink" title={row.category}>{row.category}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-600"
                          style={{ width: `${Math.round((row.value / maxVal) * 100)}%` }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono text-xs text-muted">
                        {row.value.toLocaleString()}명
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">외국인 건강보험 적용인구</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">국민건강보험공단 · 2022</span>
            </div>
            <div className="surface p-5">
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                <div><p className="text-lg font-black text-ink">{grandTotal.toLocaleString()}</p><p className="text-xs text-muted">전체 적용인원</p></div>
                <div><p className="text-lg font-black" style={{ color: "#0f766e" }}>{workplaceTotal.toLocaleString()}</p><p className="text-xs text-muted">직장가입</p></div>
                <div><p className="text-lg font-black" style={{ color: "#3157a4" }}>{regionalTotal.toLocaleString()}</p><p className="text-xs text-muted">지역가입</p></div>
              </div>
              <div className="space-y-2">
                {sorted.slice(0, 15).map((row) => (
                  <div key={row.region} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-xs text-ink">{row.region}</span>
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
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">다문화가족 현황</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                여성가족부{multiculturalFamilySummary.latestYear ? ` · ${multiculturalFamilySummary.latestYear}` : ""}
              </span>
            </div>
            <div className="surface p-5">
              <p className="mb-3 text-xs text-muted">
                총 다문화가족 {multiculturalFamilySummary.totalCount.toLocaleString()}명 · 결혼이민자·귀화자 가족의 금융 서비스 수요 기반
              </p>
              <div className="space-y-2">
                {sorted.map((row, i) => (
                  <div key={`${row.region}-${i}`} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-xs text-ink">{row.region}</span>
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
      <section>
        <div className="mb-3 flex items-center gap-2">
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
            <div className="grid grid-cols-3 gap-4 border-b border-line px-5 py-4 text-center">
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
          고용허가제 E-9 국가별·업종별 도입(고용노동부). 매일 18:30 UTC 수집 배치 완료 시 자동 갱신.
        </p>
      </section>

      {/* ── 실데이터 차트: 종사상지위·산업·연령 (KOSIS 이민자체류실태조사) ───── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
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
          연령계층별 경제활동 DT_2FA005F). 매일 18:30 UTC 수집 배치 완료 시 자동 갱신.
        </p>
      </section>

      {/* ── 컴플라이언스 주의사항 ────────────────────────────────── */}
      <section>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold text-amber-900">컴플라이언스 주의사항</h2>
          </div>
          <ul className="space-y-2">
            {COMPLIANCE_NOTES.map((note) => (
              <li key={note} className="flex items-start gap-2 text-xs text-amber-900">
                <CreditCard size={11} className="mt-0.5 shrink-0 text-amber-600" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
