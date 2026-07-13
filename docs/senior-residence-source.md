# 노인복지시설(시니어 레지던스) 데이터 — 출처 및 API 적용 계획

`honeyhyunee/senior-residence-dashboard`(정적 HTML, 값 하드코딩)에서 노인복지시설 공급현황 데이터를
frfd로 이식했다. 이 문서는 **원천 출처**와 **라이브 API 전환 계획**을 기록한다.

## 1. 원천 출처 (확정)

| 항목 | 내용 |
|---|---|
| 제공기관 | 보건복지부 (정보통계담당관) |
| 자료명 | **2025 노인복지시설 현황** |
| 기준일 | **2024-12-31** |
| dataset | 공공데이터포털 [15039034](https://www.data.go.kr/data/15039034/fileData.do) |
| 형태 | **파일데이터(HWPX)** — OpenAPI 아님 (원저자는 이 보고서에서 수치를 발췌·하드코딩) |

## 2. 이식된 데이터 (data-first 단계, 완료)

- `data/raw/mohw_senior_welfare_housing_2026-07-13.csv` — 노인복지주택(실버타운) **43개소** 명부
  (시설명·시도·시군구·주소·세대수·입주세대·유형[분양/임대/혼합]·위경도·설치연월). 좌표는 원본 카카오 지오코딩 추정값.
- `data/raw/mohw_senior_facility_by_region_2026-07-13.csv` — 시도별 집계(양로시설·노인요양시설): 시설수·정원·현원.
- `data/raw/mohw_senior_facility_trend_2026-07-13.csv` — 연도별 추이 2019–2024(양로시설·노인요양시설·노인복지주택): 시설수·정원.
- `lib/data/seniorResidence.ts` — 위 데이터를 타입드 상수로 노출(`SENIOR_HOUSING_FACILITIES`, `SENIOR_FACILITY_BY_REGION`, `SENIOR_FACILITY_TREND`, `SENIOR_SOURCE`).

> 주의: 실버타운 43개소는 **전국 완전목록이 아니라 큐레이션 세트**다(원본 기준). 완전목록은 아래 API 단계에서 확보.

## 3. 라이브 API 전환 계획 (next phase)

단일 API로는 원본 전 항목이 안 나온다. 시설명부 + 집계/추이를 **조합**해야 한다.

| 목적 | API | dataset | 비고 |
|---|---|---|---|
| 시설 명부(주소·정원·현원·좌표) | 지자체 노인주거복지시설 현황 (경기/서울 등) | 경기데이터드림 / data.seoul.go.kr | 세대수·입소정원·입소현원·설치일자·**WGS84 위경도**까지 필드 완전 일치. 전국은 여러 지자체 취합 필요 |
| 시설 명부(전국·종류코드) | 전국사회복지시설표준데이터 | [15096296](https://www.data.go.kr/data/15096296/standard.do) | `apis.data.go.kr/B554287/sclWlfrFcltInfoInqirService1/...`, 시설종류코드로 노인주거복지 필터. 좌표 없으면 카카오 지오코딩 |
| 시도별·연도별 집계/추이 | KOSIS OpenAPI | [kosis.kr/openapi](https://kosis.kr/openapi) | 양로/요양/복지주택 시설수·정원 시계열 |
| 노인요양시설 현원 | 국민건강보험공단 장기요양기관 시설별 현황 | [15124763](https://www.data.go.kr/data/15124763/fileData.do) | 입소현원 보강용 |

### 인증키 (소유자 발급 필요)
- data.go.kr / KOSIS 모두 **활용신청 → serviceKey** 발급 필요. 키는 `.env.local`(gitignored)에만,
  CI 생존이 필요하면 **GitHub Secret**으로 등록(소유자). 후보 변수명: `DATA_GO_KR_SERVICE_KEY`, 기존 `KOSIS_API_KEY` 재사용.
- 수집 스크립트는 기존 파이프라인(`scripts/fetch_public_data.mjs` + `data/registry`) 규약을 따른다.
  후보 등록: provider `보건복지부`, dataset `15039034`(집계 원천) / `15096296`(시설 표준데이터).
