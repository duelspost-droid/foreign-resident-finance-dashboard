import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  Building2,
  CreditCard,
  Globe,
  GraduationCap,
  Landmark,
  MapPin,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet
} from "lucide-react";

// ── 시장 기회 KPI ──────────────────────────────────────────────────────────────
const MARKET_KPIS = [
  {
    label: "총 체류외국인",
    value: "246만명",
    sub: "2024년 기준, 전년 대비 +5.2%",
    color: "bg-teal-700",
    icon: Users
  },
  {
    label: "연간 해외 송금 추정",
    value: "약 15조원",
    sub: "한국은행 이전소득수지 기준",
    color: "bg-blue-700",
    icon: Send
  },
  {
    label: "외국인 유학생",
    value: "185,010명",
    sub: "D-2·D-4 비자, 매년 +8.7%",
    color: "bg-violet-700",
    icon: GraduationCap
  },
  {
    label: "E-9 고용허가제 근로자",
    value: "약 30만명",
    sub: "제조·농축산업 집중, 급여계좌 필수",
    color: "bg-amber-700",
    icon: Wallet
  }
];

// ── 유스케이스 카드 ───────────────────────────────────────────────────────────
const USE_CASES = [
  {
    icon: MapPin,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    title: "지역 기반 지점·ATM 배치 전략",
    target: "대상: 시중은행, 인터넷은행",
    desc: "행안부 시군구별 외국인주민 밀도 데이터로 외국인 인구 고밀도 지역(경기 안산·시흥, 서울 구로·영등포, 경남 창원 등)을 식별합니다. 금융 기회 점수 상위 지역에 다국어 ATM 및 외국인 전담 창구를 우선 배치하면 신규 고객 획득 비용을 낮출 수 있습니다.",
    dataAxes: ["지역별 외국인 밀도", "금융 기회 점수", "경쟁 금융사 인프라 밀도"],
    actions: ["시군구별 외국인 주민수 히트맵 구축", "금융 인프라 공백 지역 식별", "다국어 서비스 지역 우선순위 결정"]
  },
  {
    icon: Wallet,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "E-9 근로자 급여계좌·적금 패키지",
    target: "대상: 시중은행, 저축은행, 캐피탈",
    desc: "고용허가제(E-9)·방문취업(H-2) 근로자는 사업주가 급여 이체를 위한 통장 개설을 필요로 합니다. 평균 계약기간 2~4년, 본국 송금 비율이 높아 '급여계좌 + 정기적금 + 해외송금 묶음 상품'이 효과적입니다. 고용노동부 외국인 고용 현황으로 업종·지역별 수요를 정밀 추정할 수 있습니다.",
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
    desc: "국적별 체류 외국인 규모와 한국은행 이전소득수지를 결합하면 국적별 월평균 송금 추정액을 산출할 수 있습니다. 중국·베트남·우즈베키스탄·필리핀·캄보디아 순으로 송금 수요가 높으며, 급여 이체 후 3~5일 내 본국 송금 패턴이 관찰됩니다.",
    dataAxes: ["법무부 국적별 체류외국인 현황", "한국은행 이전소득수지", "건강보험 외국인 직장 가입자"],
    actions: ["국적별 수취국 연계 파트너십(예: 베트남 VCB)", "급여일 D+3 알림 기반 환율 우대 프로모션", "앱 다국어 송금 UX 개선"]
  },
  {
    icon: GraduationCap,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    title: "외국인 유학생 전용 금융 패키지",
    target: "대상: 인터넷은행, 시중은행 캠퍼스 지점",
    desc: "교육부 대학별·국적별 유학생 데이터로 상위 30개 대학의 외국인 유학생 규모를 확인합니다. 학기 초(3월·9월)에 집중되는 계좌 개설 수요, 등록금 수납·생활비 송금 등 반복적 거래 패턴을 활용해 장기 고객 확보가 가능합니다.",
    dataAxes: ["교육부 대학별 외국인 유학생 현황", "대학알리미 고등교육기관 기본현황", "법무부 D-2·D-4 체류자격 통계"],
    actions: ["대학 캠퍼스 내 외국인 전담 부스 운영", "비대면 계좌 개설 + 학생증 연동 서비스", "부모 본국 → 학생 계좌 수취 특화 상품"]
  },
  {
    icon: Globe,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    title: "다문화 가족 특화 상품 개발",
    target: "대상: 시중은행, 보험사, 캐피탈",
    desc: "결혼이민(F-6) 비자 외국인은 장기 정주 의향이 높고 한국인 배우자와 공동 가계를 운영합니다. 다문화가족 현황(여성가족부) 데이터로 시군구별 다문화 가구 규모를 파악해 주택담보대출, 가족형 예금, 자녀 교육비 적금 등 가계 금융 상품 타겟팅이 가능합니다.",
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
    desc: "체류자격별 경제활동인구(통계청), 건강보험 가입 유형, 국민연금 가입 이력을 결합하면 외국인 고객의 소득 안정성을 간접 측정할 수 있습니다. 영주권(F-5)·장기거주(F-2)는 한국인에 준하는 신용 행동을, 단기 체류는 체류 잔여 기간에 비례한 리스크 관리가 필요합니다.",
    dataAxes: ["KOSIS 체류자격별 경제활동인구", "건강보험 외국인 직장/지역 가입자", "국민연금 외국인 가입자 현황"],
    actions: ["체류자격별 신용 한도 차등 정책 수립", "비자 갱신 주기 모니터링 연계 알림", "영주권 취득 예정자 신용 등급 전환 프로그램"]
  }
];

// ── 세그먼트 × 금융 상품 매트릭스 ─────────────────────────────────────────────
const SEGMENTS = [
  { visa: "E-9 (고용허가제)", population: "약 30만", payroll: "●", remit: "●", saving: "●", card: "○", loan: "○", insurance: "○" },
  { visa: "H-2 (방문취업)", population: "약 20만", payroll: "●", remit: "●", saving: "●", card: "○", loan: "△", insurance: "○" },
  { visa: "D-2 (유학)", population: "약 13만", payroll: "△", remit: "●", saving: "△", card: "●", loan: "○", insurance: "●" },
  { visa: "D-4 (어학연수)", population: "약 5만", payroll: "○", remit: "●", saving: "○", card: "●", loan: "○", insurance: "△" },
  { visa: "F-6 (결혼이민)", population: "약 15만", payroll: "△", remit: "△", saving: "●", card: "●", loan: "●", insurance: "●" },
  { visa: "F-5 (영주)", population: "약 19만", payroll: "●", remit: "○", saving: "●", card: "●", loan: "●", insurance: "●" },
  { visa: "E-7 (전문취업)", population: "약 3만", payroll: "●", remit: "●", saving: "●", card: "●", loan: "△", insurance: "●" },
  { visa: "F-2 (장기체류)", population: "약 8만", payroll: "●", remit: "△", saving: "●", card: "●", loan: "●", insurance: "●" }
];

const DOT_LEGEND = [
  { mark: "●", label: "핵심 수요 (즉시 공략 가능)" },
  { mark: "△", label: "잠재 수요 (조건부 적용)" },
  { mark: "○", label: "낮음 / 해당 없음" }
];

// ── 지역 전략 우선순위 ─────────────────────────────────────────────────────────
const REGION_STRATEGY = [
  {
    rank: 1,
    sido: "경기도",
    hotspots: "안산·시흥·화성·수원",
    dominant: "E-9 (제조업)",
    count: "약 62만명",
    priority: "고용허가제 근로자 급여계좌 + 본국 송금",
    score: 92
  },
  {
    rank: 2,
    sido: "서울특별시",
    hotspots: "구로·영등포·금천·관악",
    dominant: "다국적 (직업 다양)",
    count: "약 46만명",
    priority: "다국어 디지털 뱅킹 + 유학생 패키지",
    score: 89
  },
  {
    rank: 3,
    sido: "경상남도",
    hotspots: "창원·김해·거제",
    dominant: "E-9 (제조·조선)",
    count: "약 12만명",
    priority: "급여계좌 패키지 + 산업단지 연계 영업",
    score: 76
  },
  {
    rank: 4,
    sido: "충청남도",
    hotspots: "아산·천안·당진",
    dominant: "E-9 (자동차·반도체)",
    count: "약 10만명",
    priority: "공장 대량 급여계좌 + 적금 연계",
    score: 74
  },
  {
    rank: 5,
    sido: "인천광역시",
    hotspots: "남동·부평·서구",
    dominant: "중국 동포(H-2)",
    count: "약 9만명",
    priority: "한국어 가능 고객 대상 종합 금융 서비스",
    score: 70
  }
];

// ── 데이터 활용 로드맵 ─────────────────────────────────────────────────────────
const ROADMAP = [
  {
    phase: "0–3개월",
    label: "데이터 기반 지역 분석",
    color: "bg-teal-600",
    items: [
      "시군구별 외국인 인구 밀도 히트맵 구축",
      "현재 지점·ATM 커버리지와 외국인 밀집지 GAP 분석",
      "E-9·H-2 근로자 집중 산단 리스트업",
      "경쟁사 외국인 서비스 현황 스캔"
    ]
  },
  {
    phase: "3–6개월",
    label: "타겟 세그먼트 상품 론칭",
    color: "bg-blue-600",
    items: [
      "E-9 급여계좌 + 해외송금 번들 상품 출시",
      "상위 5개 외국인 유학생 대학 캠퍼스 부스 운영",
      "다국어(베트남어·중국어·영어) 앱/창구 지원 시작",
      "결혼이민(F-6) 가계 금융 패키지 파일럿"
    ]
  },
  {
    phase: "6–12개월",
    label: "국적별 파트너십 & 리스크 모델",
    color: "bg-violet-600",
    items: [
      "베트남·우즈베키스탄 현지 은행 송금 파트너십 체결",
      "체류자격별 신용 행동 데이터 축적 및 모델 설계",
      "국민연금·건강보험 가입 이력 활용 소득 추정 로직",
      "외국인 전용 간편 신용대출 파일럿 (F-5·F-2 우선)"
    ]
  },
  {
    phase: "12개월+",
    label: "플랫폼 전환 & 생태계 확장",
    color: "bg-rose-600",
    items: [
      "외국인 전용 종합 금융 앱 브랜드화",
      "다문화 가족 전용 자산관리 서비스 추가",
      "귀화·영주권 취득 고객 VIP 전환 프로그램",
      "데이터 기반 외국인 고객 LTV 모델 고도화"
    ]
  }
];

// ── 리스크 및 컴플라이언스 주의사항 ────────────────────────────────────────────
const COMPLIANCE_NOTES = [
  "모든 분석은 집계 통계 기반입니다. 외국인등록번호·여권번호·이름 등 개인 식별 정보를 금융 상품 설계에 직접 사용하지 않습니다.",
  "체류자격별 금융 서비스 차등 제공 시 국가인권위원회 지침 및 금융소비자보호법 준수가 필요합니다.",
  "외국인 대상 환전·송금 서비스는 외국환거래법 및 특정금융거래정보법(FIU) 규정을 적용합니다.",
  "소수 국적/체류자격 셀은 통계적 식별 가능성을 방지하기 위해 상위 분류 병합 또는 마스킹이 필요합니다."
];

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "bg-teal-500" : score >= 70 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-700">{score}</span>
    </div>
  );
}

function DotCell({ mark }: { mark: string }) {
  const color =
    mark === "●" ? "text-teal-600" : mark === "△" ? "text-amber-500" : "text-slate-300";
  return (
    <td className={`border-b border-slate-100 px-3 py-2 text-center text-lg font-bold ${color}`}>
      {mark}
    </td>
  );
}

export default function FinancialInsightsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* ── 페이지 헤더 ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Landmark size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">금융회사 활용 인사이트</h1>
            <p className="mt-1 text-sm text-slate-600">
              외국인 체류·경제활동 공공 통계를 은행·캐피탈 비즈니스 전략에 활용하는 방법을
              분석합니다. 모든 수치는 집계 통계 기반이며 개인 정보를 포함하지 않습니다.
            </p>
          </div>
        </div>
      </div>

      {/* ── 시장 기회 KPI ──────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          시장 규모 개요
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {MARKET_KPIS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color} text-white`}>
                  <Icon size={18} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-800">{kpi.label}</p>
                <p className="mt-1 text-xs text-slate-500">{kpi.sub}</p>
              </div>
            );
          })}
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
              <div
                key={uc.title}
                className={`rounded-xl border ${uc.border} ${uc.bg} p-5 shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm`}>
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
                <th className="px-3 py-3 text-center font-semibold">추정 인원</th>
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
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center text-slate-600">
                    {seg.population}
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

      {/* ── 지역 전략 우선순위 ──────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
          지역별 금융 전략 우선순위
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 text-left font-semibold">순위</th>
                <th className="px-4 py-3 text-left font-semibold">시·도</th>
                <th className="px-4 py-3 text-left font-semibold">핵심 지역</th>
                <th className="px-4 py-3 text-left font-semibold">주요 비자 세그먼트</th>
                <th className="px-4 py-3 text-left font-semibold">추정 외국인 수</th>
                <th className="px-4 py-3 text-left font-semibold">전략 방향</th>
                <th className="px-4 py-3 text-left font-semibold">기회 점수</th>
              </tr>
            </thead>
            <tbody>
              {REGION_STRATEGY.map((r) => (
                <tr key={r.rank} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-400">#{r.rank}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.sido}</td>
                  <td className="px-4 py-3 text-slate-600">{r.hotspots}</td>
                  <td className="px-4 py-3 text-slate-600">{r.dominant}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.count}</td>
                  <td className="px-4 py-3 text-slate-600">{r.priority}</td>
                  <td className="px-4 py-3">
                    <ScoreBar score={r.score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
