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
import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { InsightChat } from "@/components/ai/InsightChat";
import { formatNumber } from "@/lib/utils/format";

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
        매일 01:00 KST 자동 갱신
      </span>
    </div>
  );
}

export default function FinancialInsightsPage() {
  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="금융 인사이트"
        title="금융회사 활용 인사이트"
        description="외국인 체류·경제활동 공공 통계를 은행·캐피탈 비즈니스 전략에 활용하는 방법을 분석합니다. 시장 KPI와 지역 순위는 수집 배치 완료 시 자동 갱신됩니다."
      />
      <FreshnessTag />

      {/* ── AI 인사이트 질의 ──────────────────────────────────── */}
      <section>
        <InsightChat />
      </section>

      {/* ── 시장 규모 KPI ──────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">시장 규모</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {marketKpis.sourceLabel}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "총 체류외국인",
              value: formatNumber(marketKpis.totalForeignResidents) + "명",
              delta: marketKpis.totalForeignResidentsYoy ? marketKpis.totalForeignResidentsYoy + " YoY" : "법무부 체류통계",
              sub: "법무부 2024.12",
              color: "bg-teal-700",
              icon: Users
            },
            {
              label: "외국인 유학생",
              value: formatNumber(marketKpis.foreignStudents) + "명",
              delta: marketKpis.foreignStudentsYoy ? marketKpis.foreignStudentsYoy + " YoY" : "법무부 체류현황",
              sub: "D-2·D-4 비자",
              color: "bg-violet-700",
              icon: GraduationCap
            },
            {
              label: "이전소득수지(송금 대리지표)",
              value: marketKpis.remittanceProxy,
              delta: `한국은행 ECOS · ${marketKpis.remittanceProxyYear ?? "—"}`,
              sub: "개인이전수지 기준",
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[720px] text-xs">
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
            데이터 출처: 법무부 체류외국인 현황. 매일 01:00 KST 수집 배치 완료 시 자동 갱신.
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[720px] text-xs">
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
          <table className="min-w-[560px] text-xs">
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

      {/* ── 분석 데이터 활용 바로가기 ─────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">분석 데이터 활용</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/economy" className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">경제활동·소득</h3>
              <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">임금분포·종사상지위·산업·연령·고용계약·EPS 도입·건강보험 — 외국인 경제활동·소득 데이터를 차트로 분석합니다.</p>
          </Link>
          <Link href="/consumption" className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">소비·금융거래</h3>
              <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">면세점 국적별 소비·외국인 부동산 취득·본국송금(이전소득수지)·환율 — 소비·금융거래 데이터를 차트로 분석합니다.</p>
          </Link>
        </div>
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
