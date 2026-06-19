// 외국인 금융 인사이트 데이터 지식 베이스 + 데이터 기반(로컬) 답변 엔진.
// realData(생성 데이터)에서 핵심 사실을 추출해 (1) 로컬 즉답 (2) 생성형 LLM 컨텍스트 양쪽에 사용한다.
import {
  realBopTransferIncome,
  realDutyFreeSales,
  realEpsIntroduction,
  realExchangeRate,
  realForeignAgeActivity,
  realForeignEmploymentStatus,
  realForeignIndustry,
  realForeignLandAcquisition,
  realForeignStudentNationality,
  realForeignWage,
  realHealthInsurance,
  realKediStudentRegion,
  realMulticulturalFamilySummary,
  realNationalityDistribution,
  realRegionResidents,
  realStudentSummary,
  realUniversityRanking,
  realUniversitySummary
} from "@/lib/data/generated/realData";

export type InsightFact = { topic: string; keywords: string[]; page: string; answer: string };

const n = (x: number) => Math.round(x).toLocaleString();
const eok = (won: number) => `${Math.round(won / 1e8).toLocaleString()}억원`;

// realData로부터 핵심 사실 목록을 구성한다(데이터 갱신 시 자동 반영).
export function buildInsightFacts(): InsightFact[] {
  const f: InsightFact[] = [];

  const ss = realStudentSummary;
  if (ss?.hasData) {
    const asOf = "asOfMonth" in ss && ss.asOfMonth ? `.${ss.asOfMonth}` : "";
    f.push({
      topic: "외국인 유학생 규모·추이",
      keywords: ["유학생", "학생", "규모", "추이", "총", "몇명", "몇 명", "증가", "d-2", "d-4"],
      page: "/universities",
      answer: `${ss.latestYear}${asOf} 기준 외국인 유학생은 약 ${n(ss.total)}명입니다 (학위과정 D-2 ${n(ss.degree)} · 어학연수 ${n(ss.language)}). 전년 동기 대비 ${ss.yoy > 0 ? "+" : ""}${ss.yoy}%로 증가세입니다.`
    });
  }

  const nat = realForeignStudentNationality;
  if (nat?.byNationality?.length) {
    const top = nat.byNationality.slice(0, 5).map((x) => `${x.nationality} ${n(x.value)}명`).join(", ");
    f.push({
      topic: "유학생 국적 분포",
      keywords: ["유학생", "국적", "베트남", "중국", "몽골", "어느 나라", "나라별", "국가별"],
      page: "/universities",
      answer: `${nat.latestYear}년 외국인 유학생 국적 상위: ${top}. 국적별 송금·환전·등록금 납부 수요의 우선순위 지표입니다.`
    });
  }

  const uni = realUniversityRanking;
  if (uni?.length) {
    const top = uni.slice(0, 5).map((u, i) => `${i + 1}. ${u.university}(${n(u.foreignStudents)})`).join(", ");
    f.push({
      topic: "외국인 유학생 대학 순위",
      keywords: ["대학", "학교", "top", "순위", "한양", "캠퍼스", "어느 대학"],
      page: "/universities",
      answer: `외국인 유학생 최다 대학(${realUniversitySummary.latestYear ?? ""}): ${top}명. 학기 초 계좌개설·등록금 송금 캠페인의 1차 타깃 캠퍼스입니다.`
    });
  }

  const kedi = realKediStudentRegion;
  if (kedi?.byRegion?.length) {
    const top = kedi.byRegion.slice(0, 4).map((r) => `${r.region} ${n(r.value)}`).join(", ");
    f.push({
      topic: "유학생 시도별 분포",
      keywords: ["유학생", "지역", "시도", "서울", "경기"],
      page: "/universities",
      answer: `${kedi.latestYear}년 시도별 외국인 유학생: ${top}명. 지역 캠퍼스 지점 전략에 활용됩니다.`
    });
  }

  const wage = realForeignWage;
  if (wage?.distribution?.length) {
    const top = [...wage.distribution].sort((a, b) => b.value - a.value)[0];
    f.push({
      topic: "외국인 임금 분포",
      keywords: ["임금", "소득", "월급", "급여", "얼마", "벌"],
      page: "/economy",
      answer: `${wage.latestYear}년 외국인 취업자 월평균 임금 최다 구간은 '${top.band}'(${n(top.value)}${wage.unit})입니다. 소득 구간은 급여계좌·신용·대출 수요의 직접 대리지표입니다.`
    });
  }

  const emp = realForeignEmploymentStatus;
  if (emp?.distribution?.length) {
    f.push({
      topic: "외국인 종사상지위(고용 안정성)",
      keywords: ["종사상", "고용", "상용", "정규", "안정", "취업", "근로자", "자영업"],
      page: "/economy",
      answer: `${emp.latestYear}년 외국인 취업자 중 상용근로자 비중은 ${emp.regularShare ?? "-"}%입니다. 상용직은 안정 급여소득 → 신용·대출·자동이체 적금의 우량 모집단입니다.`
    });
  }

  const ind = realForeignIndustry;
  if (ind?.distribution?.length) {
    const top = [...ind.distribution].sort((a, b) => b.value - a.value)[0];
    f.push({
      topic: "외국인 산업별 취업",
      keywords: ["산업", "업종", "제조", "금융", "어디서 일", "직종"],
      page: "/economy",
      answer: `${ind.latestYear}년 외국인 취업자가 가장 많은 산업은 '${top.industry}'(${n(top.value)}${ind.unit})입니다. 금융·보험은 '전기·운수·통신·금융'에 묶여 보고됩니다.`
    });
  }

  const age = realForeignAgeActivity;
  if (age?.distribution?.length) {
    const peak = [...age.distribution].sort((a, b) => (b.employed ?? 0) - (a.employed ?? 0))[0];
    f.push({
      topic: "외국인 연령별 경제활동",
      keywords: ["연령", "나이", "세대", "30대", "청년", "고용률"],
      page: "/economy",
      answer: `${age.latestYear}년 외국인 취업자가 가장 많은 연령대는 ${peak.ageBand}(${n(peak.employed ?? 0)}${age.unit}, 고용률 ${peak.employmentRate ?? "-"}%)입니다. 생애주기 금융상품 타깃팅의 축입니다.`
    });
  }

  const eps = realEpsIntroduction;
  if (eps?.byCountry?.length) {
    const top = eps.byCountry[0];
    const latest = eps.trend?.length ? [...eps.trend].sort((a, b) => a.year - b.year).at(-1) : null;
    f.push({
      topic: "고용허가제(E-9) 도입",
      keywords: ["e-9", "e9", "고용허가", "외국인 근로자", "도입", "eps"],
      page: "/economy",
      answer: `E-9 신규 도입 최다국은 ${top.country}(${n(top.value)}명)${latest ? ` · 최근(${latest.year}) 도입 ${n(latest.value)}명` : ""}입니다. 신규 도입은 차년도 급여계좌·해외송금 수요의 선행지표입니다.`
    });
  }

  const bop = realBopTransferIncome;
  if (bop?.annual?.length && bop.latestValue != null) {
    f.push({
      topic: "본국송금(이전소득수지)",
      keywords: ["송금", "본국", "이전소득", "해외송금", "보내", "remit"],
      page: "/consumption",
      answer: `${bop.latestYear}년 이전소득수지(개인 본국송금 거시 대리지표)는 ${n(bop.latestValue)} ${bop.unit}입니다. 외국인 송금·환전 시장 규모의 연도 추세 지표입니다.`
    });
  }

  const fx = realExchangeRate;
  if (fx?.latest && (fx.latest as { usd?: { value: number } | null }).usd) {
    const l = fx.latest as Record<string, { date: string; value: number } | null>;
    const d = l.usd?.date ?? "";
    const dl = d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : "";
    f.push({
      topic: "원화 환율",
      keywords: ["환율", "원달러", "달러", "위안", "엔", "유로", "fx"],
      page: "/consumption",
      answer: `${dl} 매매기준율: 원/달러 ${l.usd?.value}원 · 원/위안 ${l.cny?.value} · 원/100엔 ${l.jpy?.value} · 원/유로 ${l.eur?.value}. 원화 약세 구간은 외국인 본국송금·환전 수요가 급증하는 시점입니다.`
    });
  }

  const duty = realDutyFreeSales;
  if (duty?.byNationality?.length) {
    const top = duty.byNationality[0];
    f.push({
      topic: "외국인 면세점 소비",
      keywords: ["면세점", "면세", "소비", "쇼핑", "카드", "매출"],
      page: "/consumption",
      answer: `${duty.latestYear}년 면세점 외국인 매출 1위 국적은 ${top.nationality}(${eok(top.value)}), 외국인 합계 ${eok(duty.foreignTotal)}입니다(JDC 지정면세점). 국적별 결제·환율 우대 프로모션 신호입니다.`
    });
  }

  const land = realForeignLandAcquisition;
  if (land?.byNationality?.length) {
    const top = land.byNationality[0];
    f.push({
      topic: "외국인 부동산(토지) 취득",
      keywords: ["부동산", "토지", "주택", "매입", "취득", "땅", "대출"],
      page: "/consumption",
      answer: `${land.latestYear}년 외국인 토지 취득액 1위 국적은 ${top.nationality}(${n(top.value)}백만원), 총 ${n(land.total)}백만원입니다(제주). 주택담보대출·자산관리·법인금융 수요와 직결됩니다.`
    });
  }

  const ndist = realNationalityDistribution;
  if (ndist?.length) {
    const top = ndist.slice(0, 5).map((x) => `${x.nationality} ${x.share}%`).join(", ");
    f.push({
      topic: "체류외국인 국적 분포",
      keywords: ["국적", "체류외국인", "비중", "분포", "어느 국적", "구성"],
      page: "/nationalities",
      answer: `체류외국인 국적 비중 상위: ${top}. 국적별 규모는 금융 수요 세그먼트의 모집단입니다.`
    });
  }

  const region = realRegionResidents;
  if (region?.length) {
    const top = [...region].sort((a, b) => b.count - a.count).slice(0, 5).map((r) => `${r.sido} ${r.sigungu}(${n(r.count)})`).join(", ");
    f.push({
      topic: "지역별 외국인 밀집",
      keywords: ["지역", "시군구", "밀집", "어디", "안산", "지점", "atm"],
      page: "/regions",
      answer: `외국인 최다 밀집 시군구: ${top}명. 지점·ATM·다국어 창구 우선 배치 지역입니다.`
    });
  }

  const health = realHealthInsurance;
  if (health?.length) {
    const total = health.reduce((s, h) => s + h.total, 0);
    f.push({
      topic: "외국인 건강보험 적용인구",
      keywords: ["건강보험", "건보", "보험", "가입", "직장가입"],
      page: "/economy",
      answer: `외국인 건강보험 적용인구는 약 ${n(total)}명입니다(직장·지역). 가입 형태는 취업·소득 안정성의 보조 지표입니다.`
    });
  }

  const mcf = realMulticulturalFamilySummary;
  if (mcf?.totalCount) {
    f.push({
      topic: "다문화가족",
      keywords: ["다문화", "결혼이민", "가족", "f-6", "가구"],
      page: "/economy",
      answer: `다문화가족은 총 ${n(mcf.totalCount)}명입니다${mcf.latestYear ? `(${mcf.latestYear})` : ""}. 결혼이민(F-6)은 장기 정주·공동가계로 주담대·가족형 예금 타깃입니다.`
    });
  }

  return f;
}

// 생성형 LLM에 넘길 데이터 컨텍스트(사실 목록을 텍스트로 직렬화).
export function buildContextText(): string {
  return buildInsightFacts()
    .map((f) => `- [${f.topic}] ${f.answer}`)
    .join("\n");
}

const STOP = /[?？.!,·…\s]+/g;
function tokenize(q: string): string[] {
  return q.toLowerCase().replace(STOP, " ").split(" ").filter((t) => t.length >= 1);
}

// 백엔드(LLM) 미연동 시 데이터 기반 즉답. 질문 키워드와 사실을 매칭해 가장 관련 높은 답을 구성한다.
export function answerLocally(question: string): { answer: string; topics: string[]; pages: string[] } {
  const facts = buildInsightFacts();
  const q = question.toLowerCase();
  const tokens = tokenize(question);

  const scored = facts
    .map((f) => {
      let score = 0;
      for (const kw of f.keywords) {
        if (q.includes(kw)) score += 2;
        else if (tokens.some((t) => kw.includes(t) || t.includes(kw))) score += 1;
      }
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    const topics = facts.slice(0, 8).map((f) => f.topic).join(" · ");
    return {
      answer:
        `질문에서 다룰 데이터 주제를 특정하지 못했습니다. 아래 주제로 물어봐 주세요:\n\n${topics}\n\n` +
        `예) "유학생 국적 1위는?", "외국인 임금 분포 알려줘", "본국송금 추세는?", "면세점 소비 최대 국적?"\n\n` +
        `(더 정교한 자유 질의는 생성형 AI 연동 후 가능합니다.)`,
      topics: [],
      pages: []
    };
  }

  const top = scored.slice(0, 3);
  const answer = top.map((x) => x.f.answer).join("\n\n");
  return {
    answer,
    topics: top.map((x) => x.f.topic),
    pages: [...new Set(top.map((x) => x.f.page))]
  };
}
