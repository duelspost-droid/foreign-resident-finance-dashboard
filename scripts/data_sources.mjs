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
//
// ── 동적 연도 설정 ───────────────────────────────────────────────────────────────
// KOSIS/OpenAPI 파라미터에 연도를 하드코딩하지 않는다.
// CY(현재 연도)를 종료 연도로, KOSIS_RECENT_PERIODS(최근 N기) 방식으로 항상 최신 자료를 요청한다.
const CY = String(new Date().getFullYear());           // "2025"
const PY = String(new Date().getFullYear() - 1);       // "2024" — OpenAPI 일부는 전년도까지만 발행
const KOSIS_RECENT = "10";                             // KOSIS newEstPrdCnt: 최근 10기(연/분기/월)

// ── 일별/월별 동적 기간 (ECOS prdCycle=D/M 용) ───────────────────────────────────
// 환율 등 일별 시계열은 YYYYMMDD, 국제수지 등 월별 시계열은 YYYYMM 형식을 사용한다.
const _now = new Date();
const _pad = (n) => String(n).padStart(2, "0");
const TODAY_YMD = `${_now.getFullYear()}${_pad(_now.getMonth() + 1)}${_pad(_now.getDate())}`;  // 오늘 (일별 종료)
const TODAY_YM = `${_now.getFullYear()}${_pad(_now.getMonth() + 1)}`;                          // 이번 달 (월별 종료)
const DAILY_START_YMD = `${_now.getFullYear() - 2}0101`;   // 최근 2년 일별 시작
const MONTHLY_START_YM = `${_now.getFullYear() - 5}01`;    // 최근 5년 월별 시작

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

  // ── 고용노동부 (E-9 고용허가제 월별 도입 인원 — data.go.kr 파일) ───────────────────
  // 15137198/15137115 는 면허코드표/대사관URL로 확인됨 → 삭제. EPS 월별 도입 대체.


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
  // 비활성화 (2026-06-16): 15050054(한국교육개발원 외국인 유학생 현황_대학)은 data.go.kr 연계형 —
  // 실다운로드 테스트 결과 atchFileId 없음(파일 없음). 유학생 국적별 분포는 동작 소스
  // moe_foreign_student_region(15100039, 법무부 월별 국적[지역]별, 17,486행)에 이미 포함됨.
  // 학위/유형 세분이 필요하면 KOSIS의 KEDI 통계표로 수집(KOSIS_API_KEY 필요).
  // 비활성화 (2026-06-16): 15050055(한국교육개발원 외국인 유학생 현황_전문대학)도 연계형 —
  // 실다운로드 테스트 결과 atchFileId 없음(파일 없음). 대학 단위는 academyinfo_foreign_student_count
  // (3069982, 304,360행)로 커버. 대학유형/학위과정 세분은 KOSIS KEDI 통계표로 수집 예정(KOSIS_API_KEY 필요).
  {
    id: "moe_foreign_student_region",
    type: "file",
    datasetId: "15100039",
    detailPk: null,
    provider: "교육부",
    title: "외국인 유학생 현황(지역별)",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "moe_foreign_student_region",
    sourceUrl: "https://www.data.go.kr/data/15100039/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "시도별 외국인 유학생 분포. 지점·캠퍼스 연계 전략 지역 우선순위 산출."
  },
  {
    id: "moe_foreign_student_latest",
    type: "file",
    datasetId: "15149964",
    detailPk: null,
    provider: "교육부",
    title: "외국인 유학생 현황(최신)",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "moe_foreign_student_latest",
    sourceUrl: "https://www.data.go.kr/data/15149964/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "교육부 최신 유학생 통계(발굴 자동화 식별). 2024년 이후 업데이트 반영."
  },

  // ── 대학알리미 (파일 다운로드, 인증키 불필요) ─────────────────────────────────────
  {
    id: "academyinfo_foreign_student_count",
    type: "file",
    datasetId: "3069982",
    detailPk: null,
    provider: "교육부(대학알리미)",
    title: "고등교육기관 외국인유학생 수",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "academyinfo_foreign_student_count",
    sourceUrl: "https://www.data.go.kr/data/3069982/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "대학알리미 대학별 외국인유학생 수. 캠퍼스별 수요 세분화 핵심 소스."
  },
  {
    id: "academyinfo_university_stats",
    type: "file",
    datasetId: "3050000",
    detailPk: null,
    provider: "교육부(대학알리미)",
    title: "고등교육기관 기본현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "academyinfo_university_stats",
    sourceUrl: "https://www.data.go.kr/data/3050000/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "대학알리미 고등교육기관 기본정보(위치·유형). 대학 외국인 유학생 지도 구축 보조."
  },

  // 비활성화 (2026-06-16): 15005710은 '외국인' 데이터가 아님 (오라벨) —
  // data.go.kr 15005710의 실제 정체는 '국민연금공단_국민연금 가입현황'(전국민 대상, 법정동·연령·성별·가입종별,
  // 국적 차원 없음). 발굴 워크플로 확인: 외국인 국적별 국민연금 가입자 통계는 공개 파일/오픈API로 존재하지 않음.
  // file로도 atchFileId 없음(metadata_without_file). 외국인 취업·소득 대리지표는 KOSIS 임금분포(DT_2FC001F)·EPS로 커버.

  // ── KOSIS 국가통계포털 오픈API (KOSIS_API_KEY 필요) ────────────────────────────
  // statisticsData.do: newEstPrdCnt=KOSIS_RECENT → 항상 최근 N기 자동 반환(연도 하드코딩 불필요).
  // statisticsParameterData.do: endPrdDe=CY → 현재 연도까지 요청(미발행 연도는 KOSIS가 무시).
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
      newEstPrdCnt: KOSIS_RECENT,   // 최근 N기 — 연도 하드코딩 없음
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
    notes: "행안부 시도별 외국인주민. newEstPrdCnt로 최신 N기 자동 수집. 첫 성공 응답으로 필드명 확정."
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
    // 40,000셀 제한으로 연도 1개 요청(최근 연도만). endPrdDe=CY 로 매년 갱신.
    params: { prdSe: "Y", startPrdDe: CY, endPrdDe: CY, objL1: "ALL", objL2: "ALL" },
    targetTable: "foreign_resident_region_month",
    outputBaseName: "kosis_foreign_resident_by_eupmyeondong",
    responseMapping: { period: "PRD_DE", region: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=110&tblId=DT_110025_A033_A",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "행안부 읍면동 단위 외국인주민. endPrdDe=CY로 매년 자동 갱신."
  },
  {
    id: "kosis_registered_foreigner_sigungu_visa",
    type: "kosis",
    provider: "KOSIS(법무부 출입국)",
    title: "시군구별 및 체류자격별 등록외국인 현황",
    category: "외국인 직접 통계",
    apiKeyEnv: "KOSIS_API_KEY",
    // Param 엔드포인트는 itmId=ALL 시 objL 누락 오류 → statisticsData.do 로 전환.
    endpoint: "https://kosis.kr/openapi/statisticsData.do",
    orgId: "111",
    tblId: "DT_1B040A11",
    params: { prdSe: "Y", newEstPrdCnt: KOSIS_RECENT, itmId: "ALL", objL1: "ALL", objL2: "ALL" },
    targetTable: "foreign_resident_region_month",
    outputBaseName: "kosis_registered_foreigner_sigungu_visa",
    responseMapping: { period: "PRD_DE", region: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=111&tblId=DT_1B040A11",
    updateCycle: "분기/연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "법무부 시군구×체류자격 등록외국인. endPrdDe=CY 동적 갱신."
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
    params: { prdSe: "Y", startPrdDe: "2018", endPrdDe: CY },
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
  // 비활성화: orgId=334 DT_334N_C0007(대학유형별)·DT_334N_C0008(국적별) 은
  // KOSIS에 존재하지 않는 tblId("해당 통계표가 존재하지 않습니다")로 확인됨.
  // 유학생 국적/유형 데이터는 교육부 파일 소스(moe_foreign_student_region 등)로 대체 수집한다.
  // 정확한 KEDI tblId 확인 시 재활성화. responseMapping 은 그대로 재사용 가능.

  // 법무부 KOSIS 테이블 — CSV 파일(moj_*)로 이미 수집하므로 중복 방지를 위해 비활성화.
  // 국적별 집계 트렌드가 필요하면 orgId=111 정확한 tblId 확인 후 재활성화 한다.
  // { id: "kosis_foreigner_by_nationality", type: "kosis", orgId: "111", tblId: "DT_1B040A1", ... },

  // ── KOSIS 추가 (2026-06-16 발굴·실검증) — 폐기된 data.go.kr 연계형 file 대체 ──────────
  // collectKosisSource가 getMeta(ITM)로 itmId·objL 실코드를 자동 채우므로 params는 prdSe만 있으면 됨.
  {
    id: "kosis_foreign_student_nationality_visa",
    type: "kosis",
    provider: "KOSIS(법무부 출입국)",
    title: "외국인 유학생 국적·성별·학위과정별 현황",
    category: "외국인 직접 통계",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "111",
    tblId: "DT_1B040A14",
    params: { prdSe: "Y" },   // 분류 ~10,215셀/년 → collectKosisSource가 셀 제한 내 최근연도 자동 조정
    targetTable: "foreign_student_university",
    outputBaseName: "kosis_foreign_student_nationality_visa",
    responseMapping: { period: "PRD_DE", nationality: "C1_NM", segment: "C3_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=111&tblId=DT_1B040A14",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "유학생 국적(227)×성별(3)×학위과정/체류자격(15: 유학D-2·전문학사·학사·석사·박사·연구·교환·연수D-4). 2026-06-16 검증 7,007행. 폐기된 교육부 file 15050054(국적별) 대체."
  },
  {
    id: "kosis_kedi_higher_edu_foreign_students",
    type: "kosis",
    provider: "KOSIS(교육부/한국교육개발원 KEDI)",
    title: "고등교육기관 외국인 유학생(시도별·학위과정)",
    category: "외국인 직접 통계",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "334",
    tblId: "DT_1963003_010_S",
    params: { prdSe: "Y" },
    targetTable: "foreign_student_university",
    outputBaseName: "kosis_kedi_higher_edu_foreign_students",
    responseMapping: { period: "PRD_DE", region: "C1_NM", segment: "C2_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=334&tblId=DT_1963003_010_S",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "KEDI 교육기본통계 고등교육기관 개황(시도별×학교현황별, 외국인 학생수 학위과정 포함). 2026-06-16 검증 612행. 대학유형 분해: 동일 시리즈 DT_1963003_011_S(전문대)·013_S(대학)·014_S(대학원) 등. 폐기된 교육부 file 15050055(대학유형별) 대체."
  },
  {
    id: "kosis_eps_introduction_by_country",
    type: "kosis",
    provider: "KOSIS(고용노동부/한국고용정보원)",
    title: "일반고용허가제(E-9) 외국인근로자 국가별 도입현황",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "118",
    tblId: "DT_11827_N001",
    params: { prdSe: "Y", newEstPrdCnt: KOSIS_RECENT },
    targetTable: "foreign_resident_status",
    outputBaseName: "kosis_eps_introduction_by_country",
    responseMapping: { period: "PRD_DE", country: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=118&tblId=DT_11827_N001",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "고용허가제 E-9 신규 도입 인원(국가별, 단위 명). 2026-06-16 검증 169행(2016~2025). data.go.kr EPS는 연계형(파일없음)이라 KOSIS로 대체. C1_NM='합계' 행 포함(집계 시 제외). 신규 입국 근로자=급여계좌·송금 수요 선행지표."
  },
  {
    id: "kosis_eps_introduction_by_industry",
    type: "kosis",
    provider: "KOSIS(고용노동부/한국고용정보원)",
    title: "일반고용허가제(E-9) 외국인근로자 업종별 도입현황",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "118",
    tblId: "DT_11827_I001",
    params: { prdSe: "Y", newEstPrdCnt: KOSIS_RECENT },
    targetTable: "foreign_resident_status",
    outputBaseName: "kosis_eps_introduction_by_industry",
    responseMapping: { period: "PRD_DE", segment: "C1_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=118&tblId=DT_11827_I001",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "고용허가제 E-9 신규 도입 인원(업종별: 제조/건설/농축산/서비스/어업 등). 2026-06-16 검증 64행."
  },

  // ── KOSIS 외국인 소득·금융 (2026-06-16 금융 발굴 워크플로 검증) ──────────────────
  {
    id: "kosis_immigrant_wage_distribution",
    type: "kosis",
    provider: "KOSIS(통계청 이민자체류실태조사)",
    title: "월평균 임금수준별 임금근로자(외국인·이민자)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "101",
    tblId: "DT_2FC001F",
    params: { prdSe: "Y", startPrdDe: "2016" },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "kosis_immigrant_wage_distribution",
    responseMapping: { period: "PRD_DE", segment: "C1_NM", characteristic: "C2_NM", item: "ITM_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_2FC001F",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "외국인/귀화 임금근로자 월평균 임금구간(100만 미만~300만 이상)×대상별×성별×체류자격(E-9/H-2/F-4/F-5/D-2 등). 소득=급여계좌·신용·대출·적금 수요 직결 핵심 지표. 2026-06-16 검증 863행(2017~2025)."
  },
  {
    id: "kosis_immigrant_contract_period",
    type: "kosis",
    provider: "KOSIS(통계청 이민자체류실태조사)",
    title: "고용계약기간별 임금근로자(외국인·이민자)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "101",
    tblId: "DT_2FC002F",
    params: { prdSe: "Y", startPrdDe: "2016" },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "kosis_immigrant_contract_period",
    responseMapping: { period: "PRD_DE", segment: "C1_NM", characteristic: "C2_NM", item: "ITM_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_2FC002F",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "외국인 고용계약기간(1개월 미만~3년 이상/미정)별 임금근로자×대상별×성별. 고용 안정성=정규 급여계좌·자동이체 모집단 대리지표. 2026-06-16 검증 624행."
  },
  {
    id: "kosis_immigrant_employment_status",
    type: "kosis",
    provider: "KOSIS(통계청 이민자체류실태조사)",
    title: "종사상 지위별 취업자(외국인·이민자)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "101",
    tblId: "DT_2FB007F",
    params: { prdSe: "Y", startPrdDe: "2016" },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "kosis_immigrant_employment_status",
    responseMapping: { period: "PRD_DE", segment: "C1_NM", characteristic: "C2_NM", item: "ITM_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_2FB007F",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "대상별(이민자/외국인/귀화)×성별×종사상지위(상용/임시·일용/자영업주/무급가족). 상용근로자 비중=안정 급여소득→신용·대출 적격 모집단 대리지표. 2026-06-16 검증 672행(2016~2025)."
  },
  {
    id: "kosis_immigrant_employment_by_industry",
    type: "kosis",
    provider: "KOSIS(통계청 이민자체류실태조사)",
    title: "산업별 취업자(외국인·이민자, 금융업 포함)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "101",
    tblId: "DT_2FB021F",
    params: { prdSe: "Y", startPrdDe: "2016" },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "kosis_immigrant_employment_by_industry",
    responseMapping: { period: "PRD_DE", segment: "C1_NM", characteristic: "C2_NM", item: "ITM_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_2FB021F",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "대상별×성별×산업(농림어업/광업·제조/건설/도소매·숙박·음식/전기·운수·통신·금융/서비스). 금융은 '전기·운수·통신·금융'에 묶여 보고됨(단독 분리 불가). 업종 구성=소득 안정성·소비 패턴 대리지표. 2026-06-16 검증 672행."
  },
  {
    id: "kosis_immigrant_econ_activity_by_age",
    type: "kosis",
    provider: "KOSIS(통계청 이민자체류실태조사)",
    title: "연령계층별 경제활동인구(외국인·이민자)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "KOSIS_API_KEY",
    endpoint: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
    orgId: "101",
    tblId: "DT_2FA005F",
    params: { prdSe: "Y", startPrdDe: "2016" },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "kosis_immigrant_econ_activity_by_age",
    responseMapping: { period: "PRD_DE", segment: "C1_NM", characteristic: "C2_NM", item: "ITM_NM", value: "DT" },
    sourceUrl: "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_2FA005F",
    updateCycle: "연",
    license: "KOSIS 이용약관",
    personalDataSafe: true,
    verified: true,
    notes: "대상별×연령계층(15~29/30~39/40~49/50~59/60+)×경활지표(경제활동인구/취업자/참가율/고용률). 연령 분포=생애주기 금융상품(적금·대출·송금) 타깃팅 대리지표. 2026-06-16 검증 1,008행."
  },

  // ── 한국은행 ECOS 오픈API (ECOS_API_KEY 필요) ─────────────────────────────────
  // 발급: https://ecos.bok.or.kr/api/#/DevGuide/apiKey
  // 형식: StatisticSearch/{key}/json/kr/{start}/{end}/{statCode}/{prdCycle}/{startDate}/{endDate}
  {
    id: "ecos_bop_transfer_income",
    type: "ecos",
    provider: "한국은행(ECOS)",
    title: "국제수지 이전소득수지 (개인 해외송금 대리지표)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "ECOS_API_KEY",
    endpoint: "https://ecos.bok.or.kr/api/StatisticSearch",
    params: {
      statCode: "301Y013",   // 국제수지(이전소득 500000·본원소득 300000 포함). 021Y205 오류 → 301Y013 정정(2026-06-16 검증, A/M 동작)
      prdCycle: "A",         // 연간(Annual)
      startDate: "2018",
      endDate: CY,
      rowsPerPage: 1000
    },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "ecos_bop_transfer_income",
    sourceUrl: "https://ecos.bok.or.kr/#/StatisticsByTheme",
    updateCycle: "연/분기",
    license: "한국은행 데이터 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "외국인 본국송금 거시지표. statCode 운영 환경에서 확정 필요. ECOS_API_KEY GitHub Secret 등록 필요."
  },
  {
    id: "ecos_foreigner_fx_remittance",
    type: "ecos",
    provider: "한국은행(ECOS)",
    title: "거주자 및 비거주자 외국환 거래(개인 송금)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "ECOS_API_KEY",
    endpoint: "https://ecos.bok.or.kr/api/StatisticSearch",
    params: {
      statCode: "036Y001",   // 국민소득계정 대리 — 운영 환경에서 정확한 송금 통계 코드 확인
      prdCycle: "A",
      startDate: "2018",
      endDate: CY,
      rowsPerPage: 1000
    },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "ecos_foreigner_fx_remittance",
    sourceUrl: "https://ecos.bok.or.kr/#/StatisticsByTheme",
    updateCycle: "연",
    license: "한국은행 데이터 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "외국인 송금·환전 거래 거시지표 후보. ECOS statCode 확인 후 verified=true 전환."
  },

  // ── 한국은행 ECOS 일별/월별 시계열 (ECOS_API_KEY 필요) ─────────────────────────
  // 외국인 송금·환전·외화예금 수요는 환율·국제수지와 직접 연동된다.
  // statCode 는 ECOS 공개 통계표 코드(운영 환경에서 응답으로 최종 확정).
  {
    id: "ecos_exchange_rate_daily",
    type: "ecos",
    provider: "한국은행(ECOS)",
    title: "주요국 통화의 대원화 환율(일별)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "ECOS_API_KEY",
    endpoint: "https://ecos.bok.or.kr/api/StatisticSearch",
    params: {
      statCode: "731Y001",        // 주요국 통화의 대원화 환율
      prdCycle: "D",              // 일별(Daily)
      startDate: DAILY_START_YMD, // 최근 2년 (YYYYMMDD)
      endDate: TODAY_YMD,
      rowsPerPage: 1000
    },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "ecos_exchange_rate_daily",
    sourceUrl: "https://ecos.bok.or.kr/#/StatisticsByTheme",
    updateCycle: "일",
    license: "한국은행 데이터 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "원/달러·엔·유로·위안 일별 환율. 환율 급등락 시 외국인 본국송금·환전 수요가 급증 → 송금/환전 캠페인 타이밍 인사이트. ECOS_API_KEY GitHub Secret 등록 필요."
  },
  {
    id: "ecos_bop_transfer_monthly",
    type: "ecos",
    provider: "한국은행(ECOS)",
    title: "국제수지 이전소득수지(월별)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "ECOS_API_KEY",
    endpoint: "https://ecos.bok.or.kr/api/StatisticSearch",
    params: {
      statCode: "301Y013",         // 301Y017(경상수지 계절조정 SA000)은 이전소득 세부 없음 → 301Y013 정정(2026-06-16)
      prdCycle: "M",               // 월별(Monthly)
      startDate: MONTHLY_START_YM, // 최근 5년 (YYYYMM)
      endDate: TODAY_YM,
      rowsPerPage: 1000
    },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "ecos_bop_transfer_monthly",
    sourceUrl: "https://ecos.bok.or.kr/#/StatisticsByTheme",
    updateCycle: "월",
    license: "한국은행 데이터 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "이전소득수지(개인이전 포함) 월별 흐름. 외국인 본국송금 거시 추세 월별 추적. statCode 운영환경 확정 필요."
  },
  {
    id: "ecos_resident_fx_deposit_monthly",
    type: "ecos",
    provider: "한국은행(ECOS)",
    title: "거주자 외화예금 현황(월별)",
    category: "외국인 경제·금융 보조",
    apiKeyEnv: "ECOS_API_KEY",
    endpoint: "https://ecos.bok.or.kr/api/StatisticSearch",
    params: {
      statCode: "104Y014",         // 거주자외화예금 — 운영 환경에서 확정
      prdCycle: "M",
      startDate: MONTHLY_START_YM,
      endDate: TODAY_YM,
      rowsPerPage: 1000
    },
    targetTable: "finance_segment_aggregate",
    outputBaseName: "ecos_resident_fx_deposit_monthly",
    sourceUrl: "https://ecos.bok.or.kr/#/StatisticsByTheme",
    updateCycle: "월",
    license: "한국은행 데이터 이용약관",
    personalDataSafe: true,
    verified: false,
    notes: "거주자 외화예금 잔액 월별. 외국인 외화 보유·예금 상품 수요 대리지표. statCode 운영환경 확정 필요."
  },

  // 비활성화 (2026-06-16): 15032256은 라벨 오류 + 파일 없음 —
  // 실제 정체는 "법무부_체류외국인 실태조사(고용허가제와 방문취업제) 2013"이며 EPS 월별 도입이 아님.
  // 실다운로드 테스트 결과 atchFileId 없음. data.go.kr의 EPS 도입 데이터셋(15002263 도입계획·
  // 15105240 고용정보원 일반고용허가제 도입현황)도 전부 연계형(파일 없음).
  // EPS 월별 도입은 KOSIS 고용노동부/고용정보원 통계표로 수집 예정(KOSIS_API_KEY 필요).

  // ── 서울시 열린데이터광장 오픈API (SEOUL_OPENAPI_KEY 필요) ──────────────────────
  // 발급: https://data.seoul.go.kr/dataList/OA-14979/S/1/datasetView.do (회원가입 후)
  // 형식: https://openapi.seoul.go.kr:8088/{key}/json/{서비스명}/{시작}/{끝}/
  {
    id: "seoul_foreigner_population",
    type: "seoul",
    provider: "서울특별시(열린데이터광장)",
    title: "서울시 외국인 주민 현황(자치구별·국적별)",
    category: "외국인 직접 통계",
    apiKeyEnv: "SEOUL_OPENAPI_KEY",
    endpoint: "https://openapi.seoul.go.kr:8088",
    params: {
      serviceName: "SPOP_FOREIGNER_STTUS",  // 운영 환경에서 실제 서비스명 확인 필요
      rowsPerPage: 1000
    },
    targetTable: "foreign_resident_region_month",
    outputBaseName: "seoul_foreigner_population",
    sourceUrl: "https://data.seoul.go.kr/dataList/OA-14979/S/1/datasetView.do",
    updateCycle: "월",
    license: "서울시 공공데이터 이용허락",
    personalDataSafe: true,
    verified: false,
    notes: "서울 25개 자치구×국적별 외국인 월별 통계. serviceName 실제 값 확인 필요. SEOUL_OPENAPI_KEY GitHub Secret 등록 필요."
  },

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
    // searchYear: PY 사용 — 행안부 연간 집계는 당해년도 완성 전까지 전년도까지만 제공.
    // PY(전년도)로 설정하면 매년 자동으로 최신 완성 연도를 가져온다.
    params: { type: "json", numOfRows: "1000", pageNo: "1", searchYear: PY },
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
  },
  {
    id: "kedi_foreign_student",
    provider: "한국교육개발원",
    keyword: "외국인유학생 대학알리미",
    purpose: "대학별 외국인 유학생 수·국적·학위과정(캠퍼스 전략)"
  },
  {
    id: "foreign_student_degree",
    provider: "교육부",
    keyword: "외국인 학위과정 유학생",
    purpose: "학위/비학위 구분 외국인 학생 금융 체류 기간 추정"
  },
  {
    id: "moe_language_training",
    provider: "교육부",
    keyword: "어학연수 외국인 D-4",
    purpose: "어학연수(D-4) 비자 외국인 규모(단기 금융 수요)"
  },
  {
    id: "workhnet_foreign_job",
    provider: "한국고용정보원",
    keyword: "외국인 근로자 취업 워크넷",
    purpose: "외국인 취업 현황·업종별 분포(급여계좌 타겟 업종)"
  },
  {
    id: "mois_foreigner_settlement",
    provider: "행정안전부",
    keyword: "외국인 정착 지원 사회통합",
    purpose: "사회통합프로그램 외국인 참여자(장기거주 의향·정주 금융 수요)"
  },
  // ── 일별/월별 갱신 데이터 발굴 ───────────────────────────────────────────────
  {
    id: "moj_immigration_daily",
    provider: "법무부",
    keyword: "출입국자 일별 현황",
    purpose: "공항·항만별 외국인 일별 입출국(단기 체류·관광 흐름, 환전 수요 선행지표)"
  },
  {
    id: "moj_foreign_resident_monthly",
    provider: "법무부",
    keyword: "체류외국인 월별 통계",
    purpose: "월별 체류외국인 총계·국적별 추이(시장 규모 월 단위 모니터링)"
  },
  {
    id: "eps_worker_monthly",
    provider: "고용노동부",
    keyword: "고용허가제 외국인근로자 도입 월별",
    purpose: "E-9 월별 신규 도입 인원(급여계좌·송금 수요 선행지표)"
  },
  {
    id: "bok_exchange_rate",
    provider: "한국은행",
    keyword: "환율 원화 일별",
    purpose: "원/달러·위안·동 일별 환율(외국인 송금·환전 타이밍)"
  },
  {
    id: "tour_foreign_visitor_monthly",
    provider: "한국관광공사",
    keyword: "외래관광객 입국 월별 국적별",
    purpose: "월별 국적별 외국인 입국(단기 외국인 금융·환전 수요 규모)"
  }
];
