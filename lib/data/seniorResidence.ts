// 노인복지시설(시니어 레지던스) 공급현황 — 원천: 보건복지부 「2025 노인복지시설 현황」(기준일 2024-12-31).
// 공공데이터포털 dataset 15039034 (파일데이터, HWPX). https://www.data.go.kr/data/15039034/fileData.do
// senior-residence-dashboard(honeyhyunee, 정적 HTML)에서 하드코딩돼 있던 값을 그대로 이식.
// 시설 단위 좌표(lat/lng)는 원본에서 카카오 지오코딩된 값으로 추정. 전국 완전목록이 아닌 큐레이션 세트(노인복지주택 43개소).
// TODO(API): 라이브화 시 전국사회복지시설표준데이터(15096296)+KOSIS+건보공단 장기요양기관(15124763) 조합. docs/senior-residence-source.md 참조.
//
// raw: data/raw/mohw_senior_welfare_housing_2026-07-13.csv, mohw_senior_facility_by_region_2026-07-13.csv, mohw_senior_facility_trend_2026-07-13.csv

export const SENIOR_SOURCE = {
  provider: "보건복지부",
  title: "2025 노인복지시설 현황",
  datasetId: "15039034",
  url: "https://www.data.go.kr/data/15039034/fileData.do",
  baseDate: "2024-12-31",
} as const;

/** 노인주거복지시설 중 노인복지주택(분양·임대·혼합) — 시설 단위 명부 */
export interface SeniorHousingFacility {
  name: string;
  sido: string;
  sigungu: string;
  address: string;
  units: number;      // 세대수
  occupied: number;   // 입주세대
  type: "분양" | "임대" | "혼합";
  lat: number;
  lng: number;
  established: string; // YYYY.MM
}

/** 시도별 집계(양로시설·노인요양시설) */
export interface FacilityRegionStat {
  type: "양로시설" | "노인요양시설";
  sido: string;
  count: number;    // 시설수
  capacity: number; // 정원
  current: number;  // 현원
}

/** 연도별 추이(양로시설·노인요양시설·노인복지주택) */
export interface FacilityTrendPoint {
  type: "양로시설" | "노인요양시설" | "노인복지주택";
  year: number;
  count: number;    // 시설수
  capacity: number; // 정원(노인복지주택은 분양세대)
}

export const SENIOR_HOUSING_FACILITIES: SeniorHousingFacility[] = [
  { name: "KB골든라이프케어 평창카운티", sido: "서울", sigungu: "종로구", address: "종로구 평창문화로 87", units: 164, occupied: 40, type: "임대", lat: 37.6076, lng: 126.9671, established: "2023.11" },
  { name: "서울시니어스타워 서울본부", sido: "서울", sigungu: "중구", address: "중구 다산로 72", units: 144, occupied: 144, type: "임대", lat: 37.5574, lng: 127.0099, established: "2015.07" },
  { name: "정동 상림원", sido: "서울", sigungu: "중구", address: "중구 정동길 21-31", units: 98, occupied: 98, type: "분양", lat: 37.5657, lng: 126.9726, established: "2005.12" },
  { name: "하이원빌리지", sido: "서울", sigungu: "용산구", address: "용산구 한강대로40가길 24", units: 114, occupied: 77, type: "임대", lat: 37.5405, lng: 126.9713, established: "2009.02" },
  { name: "노블레스타워", sido: "서울", sigungu: "성북구", address: "성북구 종암로 90", units: 239, occupied: 239, type: "혼합", lat: 37.5957, lng: 127.0296, established: "2008.04" },
  { name: "시니어캐슬 클라시온", sido: "서울", sigungu: "은평구", address: "은평구 은평로21길 34-5", units: 137, occupied: 72, type: "분양", lat: 37.6186, lng: 126.9236, established: "2007.09" },
  { name: "상암카이저펠리스", sido: "서울", sigungu: "마포구", address: "마포구 월드컵북로47길 34", units: 240, occupied: 240, type: "분양", lat: 37.5691, lng: 126.8871, established: "2011.01" },
  { name: "서울시니어스타워 가양본부", sido: "서울", sigungu: "강서구", address: "강서구 화곡로68길 102", units: 350, occupied: 337, type: "혼합", lat: 37.5584, lng: 126.8469, established: "2007.12" },
  { name: "서울시니어스타워 강서본부", sido: "서울", sigungu: "강서구", address: "강서구 공항대로 315", units: 142, occupied: 128, type: "분양", lat: 37.5583, lng: 126.8354, established: "2003.02" },
  { name: "서울시니어스타워 강남본부", sido: "서울", sigungu: "강남구", address: "강남구 자곡로 100-2", units: 95, occupied: 93, type: "혼합", lat: 37.4716, lng: 127.1005, established: "2015.04" },
  { name: "더시그넘 하우스", sido: "서울", sigungu: "강남구", address: "강남구 자곡로 204-25", units: 170, occupied: 161, type: "임대", lat: 37.4731, lng: 127.1057, established: "2017.08" },
  { name: "후성누리움", sido: "서울", sigungu: "강동구", address: "강동구 명일로 135", units: 51, occupied: 51, type: "분양", lat: 37.5506, lng: 127.1363, established: "2007.04" },
  { name: "흰돌실버타운", sido: "부산", sigungu: "수영구", address: "수영구 연수로260번길 53", units: 291, occupied: 279, type: "임대", lat: 35.1701, lng: 129.1114, established: "2000.10" },
  { name: "청라백세실버타운", sido: "인천", sigungu: "서구", address: "서구 로봇랜드로249번길 14", units: 58, occupied: 9, type: "임대", lat: 37.5329, lng: 126.654, established: "1997.12" },
  { name: "마리스텔라", sido: "인천", sigungu: "서구", address: "서구 심곡로100번길 31", units: 264, occupied: 254, type: "임대", lat: 37.5225, lng: 126.6735, established: "2015.01" },
  { name: "더시그넘하우스 청라", sido: "인천", sigungu: "서구", address: "서구 담지로 60", units: 131, occupied: 41, type: "임대", lat: 37.5262, lng: 126.6477, established: "2024.03" },
  { name: "사이언스빌리지", sido: "대전", sigungu: "유성구", address: "유성구 대덕대로 522", units: 240, occupied: 193, type: "임대", lat: 36.3985, lng: 127.3853, established: "2019.10" },
  { name: "밀마루복지마을", sido: "세종", sigungu: "세종시", address: "세종시 보듬1로 16", units: 100, occupied: 98, type: "임대", lat: 36.505, lng: 127.254, established: "2014.11" },
  { name: "유당마을", sido: "경기", sigungu: "수원시", address: "수원시 장안구 수일로191번길 26", units: 261, occupied: 261, type: "임대", lat: 37.3057, lng: 126.9996, established: "2015.07" },
  { name: "광교아르데코", sido: "경기", sigungu: "수원시", address: "수원시 광교로42번길 80", units: 261, occupied: 261, type: "분양", lat: 37.2895, lng: 127.0508, established: "2017.08" },
  { name: "광교두산위브", sido: "경기", sigungu: "수원시", address: "수원시 영통구 광교중앙로 55", units: 547, occupied: 547, type: "분양", lat: 37.2789, lng: 127.0453, established: "2018.05" },
  { name: "삼성노블카운티", sido: "경기", sigungu: "용인시", address: "용인시 기흥구 덕영대로 1751", units: 555, occupied: 546, type: "임대", lat: 37.2657, lng: 127.0734, established: "2001.04" },
  { name: "스프링카운티자이", sido: "경기", sigungu: "용인시", address: "용인시 기흥구 동백죽전대로 333", units: 1345, occupied: 1345, type: "분양", lat: 37.2438, lng: 127.1218, established: "2019.10" },
  { name: "성남시 아리움", sido: "경기", sigungu: "성남시", address: "성남시 중원구 광명로 46", units: 19, occupied: 18, type: "임대", lat: 37.4507, lng: 127.1425, established: "2009.01" },
  { name: "서울시니어스타워 분당본부", sido: "경기", sigungu: "성남시", address: "성남시 분당구 구미로173번길 47", units: 254, occupied: 242, type: "혼합", lat: 37.3576, lng: 127.1095, established: "2003.09" },
  { name: "정원속궁전", sido: "경기", sigungu: "성남시", address: "성남시 분당구 불정로 112", units: 170, occupied: 160, type: "혼합", lat: 37.3744, lng: 127.1193, established: "2005.07" },
  { name: "더 헤리티지", sido: "경기", sigungu: "성남시", address: "성남시 분당구 대왕판교로 155", units: 390, occupied: 390, type: "분양", lat: 37.3897, lng: 127.1195, established: "2009.09" },
  { name: "에버그린센터", sido: "경기", sigungu: "남양주시", address: "남양주시 수동면 비룡로1782번길 160", units: 51, occupied: 50, type: "임대", lat: 37.7077, lng: 127.3386, established: "2019.04" },
  { name: "수동시니어타운", sido: "경기", sigungu: "남양주시", address: "남양주시 수동면 비룡로 801-88", units: 136, occupied: 97, type: "임대", lat: 37.7052, lng: 127.3421, established: "2003.09" },
  { name: "벽산블루밍 더클래식", sido: "경기", sigungu: "하남시", address: "하남시 하남대로 770", units: 220, occupied: 220, type: "분양", lat: 37.5403, lng: 127.2148, established: "2010.07" },
  { name: "블레스힐링타운", sido: "경기", sigungu: "오산시", address: "오산시 세마역로 49", units: 30, occupied: 15, type: "임대", lat: 37.154, lng: 127.0723, established: "2024.07" },
  { name: "안성크리스찬 휴빌리지", sido: "경기", sigungu: "안성시", address: "안성시 미리내성지로 274-3", units: 76, occupied: 28, type: "혼합", lat: 37.0203, lng: 127.0957, established: "2017.03" },
  { name: "청심빌리지 실버타운", sido: "경기", sigungu: "가평군", address: "가평군 설악면 미사리로 191-16", units: 155, occupied: 155, type: "임대", lat: 37.6912, lng: 127.5241, established: "2005.06" },
  { name: "생명의빛홈타운", sido: "경기", sigungu: "가평군", address: "가평군 설악면 봉미산안길 335", units: 36, occupied: 34, type: "임대", lat: 37.6723, lng: 127.5159, established: "2022.01" },
  { name: "동해약천온천실버타운", sido: "강원", sigungu: "동해시", address: "동해시 석두골길 145", units: 155, occupied: 80, type: "임대", lat: 37.5245, lng: 129.0929, established: "2004.12" },
  { name: "청주아침햇살실버타운", sido: "충북", sigungu: "청주시", address: "청주시 청원구 사뜸로61번길 62", units: 30, occupied: 18, type: "임대", lat: 36.6609, lng: 127.4901, established: "2023.09" },
  { name: "공주원로원 노인복지주택", sido: "충남", sigungu: "공주시", address: "공주시 연수원길 47-30", units: 100, occupied: 100, type: "혼합", lat: 36.4398, lng: 127.1189, established: "2016.09" },
  { name: "옥성골든카운티", sido: "전북", sigungu: "전주시", address: "전주시 완산구 중인1길 136-20", units: 446, occupied: 446, type: "분양", lat: 35.8219, lng: 127.1237, established: "2003.05" },
  { name: "부영노인전용주택", sido: "전북", sigungu: "김제시", address: "김제시 하동1길 79-1", units: 150, occupied: 127, type: "임대", lat: 35.8031, lng: 126.8812, established: "2000.10" },
  { name: "내장산실버아파트", sido: "전북", sigungu: "정읍시", address: "정읍시 금붕1길 190", units: 147, occupied: 142, type: "혼합", lat: 35.5701, lng: 126.8583, established: "2011.11" },
  { name: "서울시니어스타워 고창타워", sido: "전북", sigungu: "고창군", address: "고창읍 석정2로 140", units: 539, occupied: 516, type: "혼합", lat: 35.4339, lng: 126.7022, established: "2017.10" },
  { name: "월명성모의집 노인복지주택", sido: "경북", sigungu: "김천시", address: "김천시 남면 주천로 1448-16", units: 100, occupied: 95, type: "임대", lat: 36.0796, lng: 128.0683, established: "1999.08" },
  { name: "에코뷰카운티(실버타운)", sido: "경남", sigungu: "양산시", address: "양산시 원동면 배내로 589", units: 30, occupied: 1, type: "임대", lat: 35.4051, lng: 129.0483, established: "2021.10" }
];

export const SENIOR_FACILITY_BY_REGION: FacilityRegionStat[] = [
  { type: "양로시설", sido: "서울", count: 9, capacity: 1073, current: 779 },
  { type: "양로시설", sido: "부산", count: 5, capacity: 673, current: 310 },
  { type: "양로시설", sido: "대구", count: 7, capacity: 499, current: 283 },
  { type: "양로시설", sido: "인천", count: 8, capacity: 294, current: 146 },
  { type: "양로시설", sido: "광주", count: 2, capacity: 152, current: 82 },
  { type: "양로시설", sido: "대전", count: 3, capacity: 247, current: 93 },
  { type: "양로시설", sido: "울산", count: 2, capacity: 114, current: 42 },
  { type: "양로시설", sido: "세종", count: 1, capacity: 15, current: 8 },
  { type: "양로시설", sido: "경기", count: 57, capacity: 2736, current: 1540 },
  { type: "양로시설", sido: "강원", count: 6, capacity: 297, current: 165 },
  { type: "양로시설", sido: "충북", count: 6, capacity: 297, current: 217 },
  { type: "양로시설", sido: "충남", count: 5, capacity: 168, current: 129 },
  { type: "양로시설", sido: "전북", count: 7, capacity: 448, current: 317 },
  { type: "양로시설", sido: "전남", count: 13, capacity: 681, current: 456 },
  { type: "양로시설", sido: "경북", count: 21, capacity: 1015, current: 636 },
  { type: "양로시설", sido: "경남", count: 12, capacity: 768, current: 483 },
  { type: "양로시설", sido: "제주", count: 2, capacity: 90, current: 70 },
  { type: "노인요양시설", sido: "서울", count: 237, capacity: 14767, current: 13345 },
  { type: "노인요양시설", sido: "부산", count: 103, capacity: 7014, current: 5502 },
  { type: "노인요양시설", sido: "대구", count: 152, capacity: 9138, current: 7916 },
  { type: "노인요양시설", sido: "인천", count: 428, capacity: 20390, current: 16584 },
  { type: "노인요양시설", sido: "광주", count: 88, capacity: 3788, current: 3094 },
  { type: "노인요양시설", sido: "대전", count: 110, capacity: 7191, current: 5911 },
  { type: "노인요양시설", sido: "울산", count: 49, capacity: 2620, current: 2165 },
  { type: "노인요양시설", sido: "세종", count: 18, capacity: 825, current: 685 },
  { type: "노인요양시설", sido: "경기", count: 1664, capacity: 84734, current: 69462 },
  { type: "노인요양시설", sido: "강원", count: 236, capacity: 11252, current: 9138 },
  { type: "노인요양시설", sido: "충북", count: 239, capacity: 11043, current: 9214 },
  { type: "노인요양시설", sido: "충남", count: 264, capacity: 12430, current: 9968 },
  { type: "노인요양시설", sido: "전북", count: 184, capacity: 8627, current: 6974 },
  { type: "노인요양시설", sido: "전남", count: 253, capacity: 10329, current: 8289 },
  { type: "노인요양시설", sido: "경북", count: 329, capacity: 15644, current: 12408 },
  { type: "노인요양시설", sido: "경남", count: 226, capacity: 12639, current: 10648 },
  { type: "노인요양시설", sido: "제주", count: 60, capacity: 3934, current: 3135 }
];

export const SENIOR_FACILITY_TREND: FacilityTrendPoint[] = [
  { type: "양로시설", year: 2019, count: 232, capacity: 13036 },
  { type: "양로시설", year: 2020, count: 209, capacity: 11619 },
  { type: "양로시설", year: 2021, count: 192, capacity: 9962 },
  { type: "양로시설", year: 2022, count: 180, capacity: 9752 },
  { type: "양로시설", year: 2023, count: 175, capacity: 9653 },
  { type: "양로시설", year: 2024, count: 166, capacity: 9567 },
  { type: "노인요양시설", year: 2019, count: 3595, capacity: 174015 },
  { type: "노인요양시설", year: 2020, count: 3844, capacity: 186289 },
  { type: "노인요양시설", year: 2021, count: 4057, capacity: 199134 },
  { type: "노인요양시설", year: 2022, count: 4346, capacity: 216784 },
  { type: "노인요양시설", year: 2023, count: 4525, capacity: 228495 },
  { type: "노인요양시설", year: 2024, count: 4640, capacity: 236365 },
  { type: "노인복지주택", year: 2019, count: 35, capacity: 7684 },
  { type: "노인복지주택", year: 2020, count: 36, capacity: 7925 },
  { type: "노인복지주택", year: 2021, count: 38, capacity: 8491 },
  { type: "노인복지주택", year: 2022, count: 39, capacity: 8840 },
  { type: "노인복지주택", year: 2023, count: 40, capacity: 9006 },
  { type: "노인복지주택", year: 2024, count: 43, capacity: 9231 }
];
