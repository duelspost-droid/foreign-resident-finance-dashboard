// 데이터 출처 조사 노트 (수동 큐레이션).
// docs/data-sources-research.md 의 조사 결과를 웹 화면(수집 파이프라인 메뉴)에 노출하기 위한 구조화 데이터.
// 새 출처를 조사·등록하면 이 파일과 scripts/data_sources.mjs 를 함께 갱신한다.

export type ResearchPriority = "high" | "mid" | "low";

export type CandidateSource = {
  provider: string;
  title: string;
  ref: string; // datasetId / tblId 등 식별자
  type: "file" | "openapi" | "kosis" | "ecos" | "portal";
  keyEnv: string | null; // 필요한 인증키 (없으면 null)
  priority: ResearchPriority;
  registered: boolean; // scripts/data_sources.mjs 에 등록되었는지
  rationale: string; // 금융 인사이트 관점 활용 근거
  sourceUrl: string;
};

export const candidateSources: CandidateSource[] = [
  // ── 등록 완료 (수집 파이프라인에 포함) ──────────────────────────────
  {
    provider: "법무부(KOSIS 111)",
    title: "시군구별·체류자격별 등록외국인",
    ref: "DT_1B040A11",
    type: "kosis",
    keyEnv: "KOSIS_API_KEY",
    priority: "high",
    registered: true,
    rationale: "시군구×비자 교차 → 지점·창구 입지 전략의 핵심 그레인",
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=111&tblId=DT_1B040A11"
  },
  {
    provider: "통계청(KOSIS 101)",
    title: "체류자격별 경제활동인구(외국인)",
    ref: "DT_2FA002F",
    type: "kosis",
    keyEnv: "KOSIS_API_KEY",
    priority: "high",
    registered: true,
    rationale: "이민자 취업·소득 → 신용·대출·급여계좌 수요 직결",
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_2FA002F"
  },
  {
    provider: "국민건강보험공단",
    title: "내·외국인 건강보험료 부과 및 급여 현황",
    ref: "15138933",
    type: "file",
    keyEnv: null,
    priority: "high",
    registered: true,
    rationale: "국적별 보험료 부과액 → 외국인 소득수준·지불능력 대리지표",
    sourceUrl: "https://www.data.go.kr/data/15138933/fileData.do"
  },
  {
    provider: "국민건강보험공단",
    title: "재외국민·외국인 건강보험 적용인구",
    ref: "15095076",
    type: "file",
    keyEnv: null,
    priority: "mid",
    registered: true,
    rationale: "직장/지역 가입자 구분 → 취업형태(급여계좌 수요) 보조",
    sourceUrl: "https://www.data.go.kr/data/15095076/fileData.do"
  },
  {
    provider: "행정안전부(KOSIS 110)",
    title: "읍면동별 외국인주민 현황",
    ref: "DT_110025_A033_A",
    type: "kosis",
    keyEnv: "KOSIS_API_KEY",
    priority: "mid",
    registered: true,
    rationale: "읍면동 단위 초세분화 → 점포·ATM·다국어 창구 미시 입지",
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=110&tblId=DT_110025_A033_A"
  },

  // ── 후속 검토 (미등록 후보) ────────────────────────────────────────
  {
    provider: "한국은행 ECOS",
    title: "국제수지·이전소득수지(개인 해외송금)",
    ref: "15059631 / ECOS",
    type: "ecos",
    keyEnv: "ECOS_API_KEY",
    priority: "high",
    registered: false,
    rationale: "개인 해외송금 거시지표 → 송금·환전 상품 시장 규모(키 별도 발급 필요)",
    sourceUrl: "https://ecos.bok.or.kr/api/"
  },
  {
    provider: "국민연금공단",
    title: "국민연금 가입현황",
    ref: "15005710",
    type: "openapi",
    keyEnv: "DATA_GO_KR_SERVICE_KEY",
    priority: "mid",
    registered: false,
    rationale: "사업장 가입 외국인 규모 → 정규 취업·급여계좌 수요",
    sourceUrl: "https://www.data.go.kr/data/15005710/openapi.do"
  },
  {
    provider: "통계청(KOSIS 567)",
    title: "외국인 국적별 등록현황",
    ref: "DT_56701_B000011",
    type: "kosis",
    keyEnv: "KOSIS_API_KEY",
    priority: "mid",
    registered: false,
    rationale: "국적 차원 시계열 보강 → 국적별 상품·언어 타겟팅",
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=567&tblId=DT_56701_B000011"
  },
  {
    provider: "금융위원회",
    title: "금융통계 국내은행정보",
    ref: "15061304",
    type: "openapi",
    keyEnv: "DATA_GO_KR_SERVICE_KEY",
    priority: "low",
    registered: false,
    rationale: "지역 은행 인프라·금융 접근성 보조 지표",
    sourceUrl: "https://www.data.go.kr/data/15061304/openapi.do"
  },
  {
    provider: "서울특별시",
    title: "서울 열린데이터광장(자치구별 외국인·연금)",
    ref: "data.seoul.go.kr",
    type: "portal",
    keyEnv: "SEOUL_OPENAPI_KEY",
    priority: "low",
    registered: false,
    rationale: "자치구 단위 정밀 통계(서울시 키 별도 발급, collector 신규 필요)",
    sourceUrl: "https://data.seoul.go.kr/"
  }
];

export type DataAxis = {
  axis: string;
  sources: string;
  insight: string;
};

// 데이터 축 × 금융 인사이트 매핑 (분석가용 관점 정리)
export const dataAxisMapping: DataAxis[] = [
  { axis: "규모·분포", sources: "법무부 체류현황, 행안부 외국인주민", insight: "시장 규모, 지점 후보지 선정" },
  { axis: "지역 세분화", sources: "KOSIS 시군구/읍면동", insight: "점포·ATM·다국어 창구 입지" },
  { axis: "취업·소득", sources: "통계청 경제활동, 건보 보험료", insight: "신용·대출·급여계좌 타겟팅" },
  { axis: "송금 수요", sources: "한국은행 ECOS 이전소득", insight: "송금·환전 상품 규모 추정" },
  { axis: "유학생", sources: "교육부·대학알리미", insight: "계좌개설·체크카드·등록금 납부" },
  { axis: "다문화·정주", sources: "여가부 다문화, 건보 적용인구", insight: "가족금융·장기 상품" }
];
