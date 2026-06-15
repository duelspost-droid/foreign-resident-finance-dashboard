// 외국인 관련 공개 데이터 출처 카탈로그.
//
// 모든 출처는 개인 단위 정보가 아닌 집계 통계만 사용한다 (CLAUDE.md 제약 준수).
// type 별 수집 방식:
//   - "file":    공공데이터포털(data.go.kr) 파일데이터 다운로드. 인증키 불필요.
//   - "openapi": data.go.kr REST 오픈API. DATA_GO_KR_SERVICE_KEY 필요.
//   - "kosis":   KOSIS 통계정보 오픈API. KOSIS_API_KEY 필요.
//
// 인증키가 없으면 해당 소스는 수집을 건너뛰되, 이력(lineage)에는 "skipped_no_key" 로 기록한다.
// verified=false 인 endpoint/tblId 는 운영 환경에서 실제 응답으로 확정해야 한다.

export const publicDataSources = [
  // ── 법무부 / 출입국·외국인정책본부 (파일 다운로드, 인증키 불필요) ──────────────
  {
    id: "moj_foreign_resident_status_2024",
    type: "file",
    datasetId: "3045188",
    detailPk: "uddi:2183c61a-db54-4844-ae97-a69d1c2ad47b",
    provider: "법무부",
    title: "체류외국인 국적 및 체류자격별 현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_status",
    outputBaseName: "moj_foreign_resident_status_2024",
    sourceUrl: "https://www.data.go.kr/data/3045188/fileData.do",
    updateCycle: "연/분기",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: true,
    notes: "국적×체류자격 집계. 세그먼트 산출의 1차 소스."
  },
  {
    id: "moj_foreign_stay_data_2024",
    type: "file",
    datasetId: "3069963",
    detailPk: null,
    provider: "법무부",
    title: "외국인체류데이터",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_region_month",
    outputBaseName: "moj_foreign_stay_data_2024",
    sourceUrl: "https://www.data.go.kr/data/3069963/fileData.do",
    updateCycle: "연/분기",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: true,
    notes: "지역 단위 체류 현황."
  },
  {
    id: "moj_foreign_student_stay_2024",
    type: "file",
    datasetId: "15100038",
    detailPk: null,
    provider: "법무부",
    title: "연도별 외국인 유학생 체류 현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "moj_foreign_student_stay_2024",
    sourceUrl: "https://www.data.go.kr/data/15100038/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: true,
    notes: "유학(D-2)·연수(D-4) 체류 추세."
  },

  // ── 고용노동부 (파일 다운로드, 인증키 불필요) ──────────────────────────────────────
  {
    id: "mol_foreign_worker_employment_2024",
    type: "file",
    datasetId: "15137198",
    detailPk: null,
    provider: "고용노동부",
    title: "외국인 고용 현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_status",
    outputBaseName: "mol_foreign_worker_employment_2024",
    sourceUrl: "https://www.data.go.kr/data/15137198/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "고용허가제(E-9·H-2) 외국인 고용 집계. 급여계좌·이체 수요 추정 보조."
  },
  {
    id: "mol_foreign_worker_employment2_2024",
    type: "file",
    datasetId: "15137115",
    detailPk: null,
    provider: "고용노동부",
    title: "외국인 취업자 현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_status",
    outputBaseName: "mol_foreign_worker_employment2_2024",
    sourceUrl: "https://www.data.go.kr/data/15137115/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "외국인 취업자 세부 통계. 발굴 자동화로 식별됨."
  },

  // ── 여성가족부 / 다문화가족 (파일 다운로드, 인증키 불필요) ────────────────────────
  {
    id: "mogef_multicultural_family_2024",
    type: "file",
    datasetId: "15054868",
    detailPk: null,
    provider: "여성가족부",
    title: "다문화가족 현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_status",
    outputBaseName: "mogef_multicultural_family_2024",
    sourceUrl: "https://www.data.go.kr/data/15054868/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "결혼이민자·다문화가구 집계. 금융 상품 수요 보조 지표."
  },

  // ── 국민건강보험공단 / 국민연금 (파일·API, 외국인 가입자 = 소득·지불능력 지표) ────
  {
    id: "nhis_foreigner_premium_2023",
    type: "file",
    datasetId: "15138933",
    detailPk: null,
    provider: "국민건강보험공단",
    title: "내·외국인 건강보험료 부과 및 급여 현황",
    category: "외국인 경제·금융 보조",
    baseDate: "2023-12-31",
    targetTable: "finance_segment_aggregate",
    outputBaseName: "nhis_foreigner_premium_2023",
    sourceUrl: "https://www.data.go.kr/data/15138933/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "국적별 보험료 부과액·급여비. 외국인 소득수준·지불능력 대리지표(금융 세그먼트 보조)."
  },
  {
    id: "nhis_foreigner_coverage_2022",
    type: "file",
    datasetId: "15095076",
    detailPk: null,
    provider: "국민건강보험공단",
    title: "재외국민 및 외국인 건강보험 적용인구",
    category: "외국인 직접 통계",
    baseDate: "2022-12-31",
    targetTable: "foreign_resident_status",
    outputBaseName: "nhis_foreigner_coverage_2022",
    sourceUrl: "https://www.data.go.kr/data/15095076/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "외국인 직장/지역 가입자 구분. 취업형태(급여계좌 수요) 보조 지표."
  },

  // ── 법무부 추가 (파일 다운로드, 인증키 불필요) ────────────────────────────────────
  {
    id: "moj_immigration_monthly_2024",
    type: "file",
    datasetId: "3069975",
    detailPk: null,
    provider: "법무부",
    title: "출입국 외국인 통계월보",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_region_month",
    outputBaseName: "moj_immigration_monthly_2024",
    sourceUrl: "https://www.data.go.kr/data/3069975/fileData.do",
    updateCycle: "월",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "법무부 출입국 월별 통계. 발굴 자동화로 식별됨."
  },

  // ── 행정안전부 외국인주민 (파일 다운로드, 인증키 불필요) ─────────────────────────
  // data.go.kr 자동 발굴(discovery)로 식별된 후보. 다운로드 성공 시 verified=true 로 전환.
  {
    id: "mois_foreign_resident_region_file",
    type: "file",
    datasetId: "3079542",
    detailPk: null,
    provider: "행정안전부",
    title: "지방자치단체 외국인주민 현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_region_month",
    outputBaseName: "mois_foreign_resident_region_file",
    sourceUrl: "https://www.data.go.kr/data/3079542/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "행안부 시군구 단위 외국인주민. openapi 대체용 파일 수집(발굴 자동화)."
  },

  // ── 교육부 외국인 유학생 (파일 다운로드, 인증키 불필요) ──────────────────────────
  {
    id: "moe_foreign_student_by_nationality",
    type: "file",
    datasetId: "15050054",
    detailPk: null,
    provider: "교육부",
    title: "외국인 유학생 현황(국적별)",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "moe_foreign_student_by_nationality",
    sourceUrl: "https://www.data.go.kr/data/15050054/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "교육부 대학·국적별 유학생. 유학생 금융 수요 세분화(발굴 자동화)."
  },

  // ── KOSIS 국가통계포털 오픈API (KOSIS_API_KEY 필요) ────────────────────────────
  // KOSIS statisticsData.do (simpler than statisticsParameterData.do — no objL* needed)
  //   ?method=getList&apiKey=...&orgId=...&tblId=...&prdSe=Y&startPrdDe=2020&endPrdDe=2024&format=json&jsonVD=Y
  {
    id: "kosis_registered_foreigner_by_region",
    type: "kosis",
    provider: "KOSIS(행정안전부 외국인주민)",
    title: "시도별 외국인주민 현황",
    category: "외국인 직접 통계",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/statisticsData.do",
    orgId: "110",
    tblId: "TX_11025_A000_A",
    params: {
      method: "getList",
      format: "json",
      jsonVD: "Y",
      prdSe: "Y",
      startPrdDe: "2020",
      endPrdDe: "2024",
      itmId: "ALL",
      objL1: "ALL",
      objL2: "ALL"
    },
    targetTable: "foreign_resident_region_month",
    outputBaseName: "kosis_registered_foreigner_by_region",
    responseMapping: { period: "PRD_DE", region: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=110&tblId=TX_11025_A000_A",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "행안부 시도별 외국인주민. 2단계 호출: getMeta(ITM)로 itmId 조회 후 statisticsParameterData.do. 첫 성공 응답으로 필드명 확정."
  },
  {
    id: "kosis_foreign_resident_by_eupmyeondong",
    type: "kosis",
    provider: "KOSIS(행정안전부 외국인주민)",
    title: "읍면동별 유형 및 지역별 외국인주민 현황",
    category: "외국인 직접 통계",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "110",
    tblId: "DT_110025_A033_A",
    params: { prdSe: "Y", startPrdDe: "2020", endPrdDe: "2024" },
    targetTable: "foreign_resident_region_month",
    outputBaseName: "kosis_foreign_resident_by_eupmyeondong",
    responseMapping: { period: "PRD_DE", region: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=110&tblId=DT_110025_A033_A",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "행안부 읍면동 단위 외국인주민(지역 세분화). 웹 조사로 정정(국적X→지역). 2단계 호출."
  },
  {
    id: "kosis_registered_foreigner_sigungu_visa",
    type: "kosis",
    provider: "KOSIS(법무부 출입국)",
    title: "시군구별 및 체류자격별 등록외국인 현황",
    category: "외국인 직접 통계",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "111",
    tblId: "DT_1B040A11",
    params: { prdSe: "Y", startPrdDe: "2020", endPrdDe: "2024" },
    targetTable: "foreign_resident_region_month",
    outputBaseName: "kosis_registered_foreigner_sigungu_visa",
    responseMapping: { period: "PRD_DE", region: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=111&tblId=DT_1B040A11",
    updateCycle: "분기/연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "법무부 시군구×체류자격 등록외국인. 지점 전략 핵심 지표. 2단계 호출."
  },
  {
    id: "kosis_foreigner_economic_activity",
    type: "kosis",
    provider: "KOSIS(통계청 이민자체류실태조사)",
    title: "체류자격별 경제활동인구(외국인)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "101",
    tblId: "DT_2FA002F",
    params: { prdSe: "Y", startPrdDe: "2018", endPrdDe: "2024" },
    targetTable: "foreign_resident_status",
    outputBaseName: "kosis_foreigner_economic_activity",
    responseMapping: { period: "PRD_DE", segment: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_2FA002F",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "통계청 이민자 체류실태·고용조사. 취업/소득 = 급여계좌·신용 수요 직결. 2단계 호출."
  },
  // 법무부 KOSIS 테이블 — CSV 파일(moj_*)로 이미 수집하므로 중복 방지를 위해 비활성화.
  // 국적별 집계 트렌드가 필요하면 orgId=111 정확한 tblId 확인 후 재활성화 한다.
  // { id: "kosis_foreigner_by_nationality", type: "kosis", orgId: "111", tblId: "DT_1B040A1", ... },

  // ── data.go.kr REST 오픈API (DATA_GO_KR_SERVICE_KEY 필요) ─────────────────────
  // 구조: https://apis.data.go.kr/{org}/{api}/{op}?serviceKey=...&type=json&pageNo=&numOfRows=
  {
    id: "mois_foreign_resident_by_region_api",
    type: "openapi",
    provider: "행정안전부",
    title: "지자체 외국인주민 현황(시군구)",
    category: "외국인 직접 통계",
    apiKeyEnv: "DATA_GO_KR_SERVICE_KEY",
    // data.go.kr 오퍼레이션 목록에서 정확한 경로 확인 필요. 아래는 후보 2개.
    // 실제 응답 확인 후 verified=true 로 변경한다.
    // 후보1: /1741000/StatisticsForeignResident/getForeignResidentInfo
    // 후보2: /1741000/YearFrgnInfo/getYearFrgnInfoList
    endpoint: "https://apis.data.go.kr/1741000/StatisticsForeignResident/getForeignResidentInfo",
    params: { type: "json", numOfRows: "1000", pageNo: "1", searchYear: "2024" },
    pagination: { pageParam: "pageNo", rowsParam: "numOfRows", rows: 1000, maxPages: 50 },
    targetTable: "foreign_resident_region_month",
    outputBaseName: "mois_foreign_resident_by_region_api",
    // 후보 필드명(한/영) — 실제 응답으로 확정. 일치하는 첫 키를 사용한다.
    responseMapping: {
      sido: ["시도", "sido", "ctprvnNm", "sidoNm"],
      sigungu: ["시군구", "sigungu", "signguNm", "sigunguNm"],
      value: ["외국인주민수", "외국인수", "frgnrCnt", "cnt", "popltnCnt"],
      period: ["기준연도", "year", "baseYear", "stdrYy"]
    },
    sourceUrl: "https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=외국인주민",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "행안부 외국인주민 시군구 집계. endpoint 경로 운영 환경에서 확정 필요."
  }
];

// data.go.kr 키워드 검색으로 신규 외국인 데이터셋을 자동 발굴(이력에 후보로 기록).
export const discoveryQueries = [
  {
    id: "mois_foreign_residents",
    provider: "행정안전부",
    keyword: "외국인주민 현황",
    purpose: "시군구 단위 장기거주 외국인주민 규모"
  },
  {
    id: "moe_foreign_students",
    provider: "교육부",
    keyword: "외국인 유학생 현황",
    purpose: "대학·국적·과정별 유학생 금융 수요"
  },
  {
    id: "academyinfo_foreign_students",
    provider: "대학알리미",
    keyword: "외국인유학생수",
    purpose: "대학별 외국인 유학생 총량 검증"
  },
  {
    id: "moj_immigration_stats",
    provider: "법무부",
    keyword: "출입국 외국인 체류",
    purpose: "체류자격·국적·지역 추가 통계 발굴"
  },
  {
    id: "mol_foreign_worker",
    provider: "고용노동부",
    keyword: "외국인 고용 취업",
    purpose: "E-9/E-7 등 취업 외국인 규모(급여계좌 수요)"
  },
  {
    id: "nia_multicultural",
    provider: "통계청/여성가족부",
    keyword: "다문화 가구 외국인",
    purpose: "결혼이민·다문화 가구 금융 수요 보조 지표"
  },
  {
    id: "bok_remittance",
    provider: "한국은행",
    keyword: "국제수지 이전소득 송금",
    purpose: "개인 해외송금·이전소득수지 거시지표(외국인 본국송금 대리지표)"
  },
  {
    id: "fsc_bank_stats",
    provider: "금융위원회",
    keyword: "금융통계 국내은행",
    purpose: "지역 은행 인프라·금융 접근성 보조 지표"
  },
  {
    id: "foreign_exchange_remittance",
    provider: "공통",
    keyword: "외국인 송금 환전",
    purpose: "외국인 대상 송금·환전 서비스 직접 통계 발굴"
  },
  {
    id: "nhis_foreigner_insurance",
    provider: "국민건강보험공단",
    keyword: "외국인 건강보험 가입",
    purpose: "외국인 직장/지역 가입자·보험료(소득·지불능력 대리지표)"
  },
  {
    id: "nps_foreigner_pension",
    provider: "국민연금공단",
    keyword: "외국인 국민연금 가입",
    purpose: "사업장 가입 외국인 규모(정규 취업·급여계좌 수요)"
  },
  {
    id: "immigrant_employment_survey",
    provider: "통계청",
    keyword: "이민자 체류실태 고용조사",
    purpose: "외국인 취업·소득·경제활동(신용·대출 수요 분석)"
  }
];
