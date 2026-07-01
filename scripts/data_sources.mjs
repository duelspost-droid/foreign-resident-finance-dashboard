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
    provider: "법무부(출입국·외국인정책본부)",
    title: "외국인 유학생 현황(월별·국적지역×체류자격)",
    category: "외국인 직접 통계",
    baseDate: "2026-04-30",
    targetTable: "foreign_student_university",
    outputBaseName: "moe_foreign_student_region",
    sourceUrl: "https://www.data.go.kr/data/15100039/fileData.do",
    updateCycle: "월",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: true,
    notes: "월별(2022~2026.4) 국적지역×구분(유학D2/한국어연수D41/외국어연수D47) 유학생 스톡. '유학생 추이'의 1차 소스 — 연도말 단독표 15100038의 2024 행 손상(D-2 절반)을 대체. build에서 연도별 최신월 스냅샷으로 집계(2024=263,775 등, e-나라지표·통계월보 교차검증). 2026-06-16 라벨 정정(교육부→법무부, 연→월)."
  },
  {
    id: "moe_foreign_student_latest",
    type: "file",
    datasetId: "15149964",
    detailPk: null,
    provider: "세종특별자치시교육청",
    title: "(주의)세종시 고등학교 외국인학생 현황 — 대학 아님",
    category: "외국인 직접 통계",
    baseDate: "2025-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "moe_foreign_student_latest",
    sourceUrl: "https://www.data.go.kr/data/15149964/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "주의: 발굴 자동화가 '교육부 유학생'으로 오식별했으나 실제 data.go.kr 15149964는 '세종시 고등학교' 외국인학생 파일(대학 0개, 65행 대부분 0명). 대학 랭킹 1차 소스에서 제외하고 academyinfo(3069982)를 1차로 사용. 폴백으로만 남김."
  },

  // ── 대학알리미 (파일 다운로드, 인증키 불필요) ─────────────────────────────────────
  {
    id: "academyinfo_foreign_student_count",
    type: "file",
    datasetId: "3069982",
    detailPk: null,
    provider: "법무부(유학생 관리정보)",
    title: "외국인 유학생 학교별 현황(학생단위)",
    category: "외국인 직접 통계",
    baseDate: "2025-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "academyinfo_foreign_student_count",
    sourceUrl: "https://www.data.go.kr/data/3069982/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: true,
    notes: "data.go.kr 3069982. 실제 데이터는 성별·국적·체류자격·학교명 학생단위 레코드(약 30만행, 라이브 빈티지 2025) — 대학별 외국인유학생 top30 랭킹의 1차 소스. build에서 학교명을 대학 패턴으로 필터 후 집계(한양대 7.7천 등). 정의 라벨이 '대학알리미'였으나 실제는 법무부 유학생관리정보로 정정(2026-06-16)."
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
    personalDataSafe: false,
    verified: false,
    notes: "⚠️ 실제 파일은 사업자 명부형(상호명·대표자명·주소 포함, 외국인 개인 실명 다수)이라 PII. 집계 가치 낮음 → build_generic_data PII_SOURCE_SKIP으로 범용 뷰어 제외. 화면 연동 시 비식별 컬럼(상호명·지역·유형)만 큐레이션할 것."
  },

  // ── 외국인 소비·거래 (data.go.kr file, 인증키 불필요 — 2026-06-16 발굴 워크플로 검증) ──
  {
    id: "jdc_dutyfree_sales_by_nationality",
    type: "file",
    datasetId: "15070346",
    detailPk: "uddi:39b3894c-2043-44f3-843e-dd2150a042bb",
    provider: "제주국제자유도시개발센터(JDC)",
    title: "JDC지정면세점 국적별 매출",
    category: "외국인 소비·거래",
    baseDate: "2024-12-31",
    targetTable: "foreign_consumption_aggregate",
    outputBaseName: "jdc_dutyfree_sales_by_nationality",
    sourceUrl: "https://www.data.go.kr/data/15070346/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "국적(내국인/일·중·미·러·태·홍·필/기타 9종)×판매년월×매출. 면세점 국적별 소비=외국인 결제·환전 수요 직접 지표. CSV 3차원, 차기등록 2026-11."
  },
  {
    id: "jeju_foreign_land_acquisition",
    type: "file",
    datasetId: "15010289",
    detailPk: "uddi:c1ef726f-204b-40f1-8392-e98f2fe9eab2",
    provider: "제주특별자치도",
    title: "외국인 토지취득현황(국적별)",
    category: "외국인 소비·거래",
    baseDate: "2024-12-31",
    targetTable: "foreign_consumption_aggregate",
    outputBaseName: "jeju_foreign_land_acquisition",
    sourceUrl: "https://www.data.go.kr/data/15010289/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "연도×국적별×월별 취득필지·취득면적(㎡)·취득금액(백만원). 외국인 부동산 매입=대출·자산관리 수요 대리지표. 취득금액(실금액) 차원 보유. 제주 한정."
  },
  // [비활성화 2026-06-16] daejeon_yuseong_foreign_consumption(15098191): fileDownload.do가 200을
  // 반환하나 유효 CSV 아님(atchFileId FILE_000000002691344 토큰 만료/HTML 응답) → download_failed.
  // 값도 절대금액 아닌 '소비지수'라 우선순위 낮음. 토큰 갱신 시 재시도 가능(detailPk uddi:1a45ed51-057e-4c93-8aad-bb6c3a4dad8e).

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
  // [비활성화 2026-06-17] kosis_foreign_resident_by_eupmyeondong: 읍면동 분류 3,957개 → objL 31,184자로
  // KOSIS URL 길이 제한 초과(skipped_too_large) → 매번 미수집. 읍면동 granularity는 우선순위 낮음(backlog #8,
  // 페이지네이션 구현 시 재활성화). 지역 단위는 시군구 소스로 커버되므로 영구 skip 대신 비활성화해 '실패' 표시 제거.
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
    verified: true,
    notes: "이전소득수지(ITEM_CODE 4B1000)=개인이전 포함 본국송금 거시 대리지표. 301Y013 전체 국제수지 표를 받아 build에서 4B1000만 필터. 2026-06-16 라이브 검증: 연간 1980~2025(2025=10,273.7백만달러). ECOS_API_KEY로 동작."
  },
  // [비활성화 2026-06-16] ecos_foreigner_fx_remittance: statCode 036Y001 라이브 응답 INFO-200(데이터 없음).
  // ECOS에는 '개인 송금' 단독 통계표가 없음(StatisticTableList 834표 중 송금/외국환 0건) → 이전소득수지(301Y013·4B1000)가 유일한 송금 대리지표라 중복. 영구 제외.

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
    verified: true,
    notes: "원/달러·엔·유로·위안 일별 환율(731Y001). 환율 급등락 시 외국인 본국송금·환전 수요 급증 → 송금/환전 캠페인 타이밍. 2026-06-16 라이브 검증: 25,714행, 원/미국달러 매매기준율 포함."
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
    verified: true,
    notes: "이전소득수지(ITEM 4B1000) 월별 흐름. 외국인 본국송금 거시 추세 월별 추적. 2026-06-16 라이브 검증: 월간 198001~202604 동작(build에서 4B1000 필터)."
  },
  // [비활성화 2026-06-16] ecos_resident_fx_deposit_monthly: statCode 104Y014는 '예금은행 총수신(평잔)=원화예금'으로
  // 외화예금이 아님. ECOS StatisticTableList에 '외화예금' 표 자체가 없음(0건) → 거주자외화예금 시계열 미제공. 영구 제외.

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

  // ── 발굴 후보 승격(fileData, datasetId 자동수집 경로) — 단일지역 통계 보강 ──
  // openapi 후보(15149911 등)는 수집기가 XML 미지원 + 활용신청 필요로 부적합 → fileData 로 승격.
  // (서울 15046960 은 metadata_without_file=다운로드 파일 미제공/활용신청 필요로 제외. 활용신청 후 추가 가능.)
  {
    id: "jeju_foreign_resident_status_district",
    type: "file",
    datasetId: "15045324",
    detailPk: null,
    provider: "제주특별자치도",
    title: "제주특별자치도 체류자격별 외국인주민현황",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_region",
    outputBaseName: "jeju_foreign_resident_status_district",
    sourceUrl: "https://www.data.go.kr/data/15045324/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "제주 체류자격별 외국인주민. 발굴 후보 15045324 승격."
  },
  {
    id: "chungnam_foreign_resident_nationality",
    type: "file",
    datasetId: "15047604",
    detailPk: null,
    provider: "충청남도",
    title: "충청남도 외국인주민 현황(국적별)",
    category: "외국인 직접 통계",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_region",
    outputBaseName: "chungnam_foreign_resident_nationality",
    sourceUrl: "https://www.data.go.kr/data/15047604/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "충남 국적별 외국인주민. 발굴 후보 15047604 승격."
  },

  // [비활성화 2026-06-17] mois_foreign_resident_by_region_api: apis.data.go.kr 응답 HTTP 500(no_data),
  // 미구독 openapi라 동작 안 함. 시군구 외국인주민은 file 소스(mois_foreign_resident_region_file, 1,692행)로
  // 이미 커버 → 영구 제외(수집기 실패 목록에서 제거).

  // ── AI 웹 발굴 에이전트(2026-06-25) 리드 중 자동수집 가능(data.go.kr file)·집계·PII낮음 7종 승격 ──
  // 모두 verified:false → CI 배치에서 실수집 확인 후 승격. 활용신청 필요분은 HTML 응답→build_real_data 가드가 스킵.
  // 큐레이션 transform 미연동이라 수집 시 '범용 데이터 뷰어'(genericData)로 자동 노출됨.
  {
    id: "moj_foreign_resident_monthly_nationality",
    type: "file",
    datasetId: "15100013",
    detailPk: null,
    provider: "법무부",
    title: "월별 국적(지역)별 체류외국인 현황",
    category: "외국인 직접 통계",
    targetTable: "foreign_resident_status",
    outputBaseName: "moj_foreign_resident_monthly_nationality",
    sourceUrl: "https://www.data.go.kr/data/15100013/fileData.do",
    updateCycle: "월",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "AI 웹 발굴 승격. 월별·국적별 체류외국인 집계(장단기). 활용신청 필요 시 HTML 응답→가드 스킵."
  },
  {
    id: "moj_naturalization_by_nationality",
    type: "file",
    datasetId: "15100047",
    detailPk: null,
    provider: "법무부",
    title: "연도별 국적취득(귀화·국적회복) 국적별 현황",
    category: "외국인 직접 통계",
    targetTable: "foreign_resident_status",
    outputBaseName: "moj_naturalization_by_nationality",
    sourceUrl: "https://www.data.go.kr/data/15100047/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "AI 웹 발굴 승격. 외국인→내국인 전환(정주형 금융수요 대리지표)."
  },
  {
    id: "moj_naturalization_by_type",
    type: "file",
    datasetId: "15100046",
    detailPk: null,
    provider: "법무부",
    title: "연도별 국적취득 유형별 현황",
    category: "외국인 직접 통계",
    targetTable: "foreign_resident_status",
    outputBaseName: "moj_naturalization_by_type",
    sourceUrl: "https://www.data.go.kr/data/15100046/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "AI 웹 발굴 승격. 일반/간이/특별귀화 유형 구성."
  },
  {
    id: "niied_topik_applicants",
    type: "file",
    datasetId: "3059526",
    detailPk: null,
    provider: "교육부 국립국제교육원",
    title: "한국어능력시험(TOPIK) 지원자 현황",
    category: "유학생/잠재유입",
    targetTable: "student",
    outputBaseName: "niied_topik_applicants",
    sourceUrl: "https://www.data.go.kr/data/3059526/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "AI 웹 발굴 승격. 유학·취업 한국어시험 지원자(신규 외국인 유입 선행지표)."
  },
  {
    id: "niied_topik_by_country_age",
    type: "file",
    datasetId: "15067926",
    detailPk: null,
    provider: "교육부 국립국제교육원",
    title: "TOPIK 시행국가별·연령별 응시자 수",
    category: "유학생/잠재유입",
    targetTable: "student",
    outputBaseName: "niied_topik_by_country_age",
    sourceUrl: "https://www.data.go.kr/data/15067926/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "AI 웹 발굴 승격. 송출국·연령별 잠재 유입 수요."
  },
  {
    id: "niied_hurik_gks",
    type: "file",
    datasetId: "15069776",
    detailPk: null,
    provider: "교육부 국립국제교육원",
    title: "국외인적자원관리시스템(HURIK) 사업별·연도별 등록인원수",
    category: "유학생/장학",
    targetTable: "student",
    outputBaseName: "niied_hurik_gks",
    sourceUrl: "https://www.data.go.kr/data/15069776/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "AI 웹 발굴 승격. 정부초청장학생(GKS) 등 안정 자금흐름 유학생 세부군."
  },
  {
    id: "kcomwel_foreign_worker_injury",
    type: "file",
    datasetId: "15104688",
    detailPk: null,
    provider: "근로복지공단",
    title: "외국인근로자 산재처리현황(재해유형별 신청·승인)",
    category: "사회보험",
    targetTable: "social_insurance",
    outputBaseName: "kcomwel_foreign_worker_injury",
    sourceUrl: "https://www.data.go.kr/data/15104688/fileData.do",
    updateCycle: "연",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "AI 웹 발굴 승격. 재해유형별 집계(개인식별 없음). 산업재해 마이크로데이터(15127634)는 식별변수 포함이라 제외."
  },

  // ── 한국부동산원 R-ONE OpenAPI (크롬 웹발굴 2026-06-30) — 전국 외국인 부동산 거래 ──
  // data.go.kr '기관자체 다운로드(외부 reb.or.kr URL)'라 파일수집 불가 → 공식 R-ONE OpenAPI(type:reb)로 수집.
  // ⚠️ 활성화 2스텝: (1) 소유자가 무료 R-ONE API 키 발급 → GitHub 시크릿 REB_API_KEY (+ pages.yml 잡 env),
  //    (2) params.statblId 확정(키 발급 후 R-ONE 카탈로그 SttsApiTbl.do 에서 조회). 둘 중 하나라도 없으면 skip.
  {
    id: "reb_foreign_land_transactions_monthly",
    type: "reb",
    apiKeyEnv: "REB_API_KEY",
    datasetId: "15068462",
    provider: "한국부동산원",
    title: "부동산거래현황 토지 거래 월별 외국인거래(전국)",
    category: "외국인 소비·자산",
    targetTable: "foreign_real_estate",
    outputBaseName: "reb_foreign_land_transactions_monthly",
    sourceUrl: "https://www.data.go.kr/data/15068462/fileData.do",
    params: { statblId: null, cycle: "MM" },
    updateCycle: "월",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "국가승인통계(제315003호)·전국·집계. 제주만 있던 외국인 부동산 데이터를 전국화. statblId·REB_API_KEY 확정 후 활성."
  },
  {
    id: "reb_foreign_building_transactions_monthly",
    type: "reb",
    apiKeyEnv: "REB_API_KEY",
    datasetId: "15068093",
    provider: "한국부동산원",
    title: "부동산거래현황 건축물(주택) 거래 월별 외국인거래(전국)",
    category: "외국인 소비·자산",
    targetTable: "foreign_real_estate",
    outputBaseName: "reb_foreign_building_transactions_monthly",
    sourceUrl: "https://www.data.go.kr/data/15068093/fileData.do",
    params: { statblId: null, cycle: "MM" },
    updateCycle: "월",
    license: "공공데이터 이용허락(제1유형)",
    personalDataSafe: true,
    verified: false,
    notes: "외국인 주택·건물 매입 규모(자산·모기지 잠재수요)의 직접 신호. statblId·REB_API_KEY 확정 후 활성."
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
  },
  // ── 전방위 외부 리서치(docs/source-research-external.md) 기반 신규 발굴 키워드 ──
  {
    id: "foreign_realestate_trade",
    provider: "한국부동산원/지자체",
    keyword: "외국인 부동산 거래 토지 주택 취득",
    purpose: "외국인 부동산 자산·거래(자산·신용·대출 직결 금융지표)"
  },
  {
    id: "customs_dutyfree_foreigner",
    provider: "관세청",
    keyword: "면세점 내외국인 매출 품목별",
    purpose: "외국인 면세 소비(고가품·기호품) 규모"
  },
  {
    id: "nts_foreign_income_tax",
    provider: "국세청",
    keyword: "외국인근로자 연말정산 소득세 신고현황",
    purpose: "외국인 국적별 근로소득·결정세액(소득 베이스)"
  },
  {
    id: "mogef_multicultural_survey",
    provider: "여성가족부",
    keyword: "다문화가족 실태조사 소득 경제활동",
    purpose: "결혼이민·다문화가구 소득·주거·경제활동(가구 금융)"
  },
  {
    id: "comwel_foreign_injury",
    provider: "근로복지공단",
    keyword: "외국인근로자 산재 보험급여 처리현황",
    purpose: "외국인 산재·보험 청구(보험 행태 보조지표)"
  },
  {
    id: "motie_fdi_trend",
    provider: "산업통상자원부",
    keyword: "외국인직접투자 FDI 동향 통계",
    purpose: "외국인 자본 유입(법인 중심·약연관, 거시 맥락)"
  },
  {
    id: "nhis_foreigner_premium",
    provider: "국민건강보험공단",
    keyword: "내외국인 건강보험료 부과 급여 현황",
    purpose: "외국인 보험료 부담·가입유형(소득 프록시)"
  }
];
