// ⚠️ 전부 '가상(합성)' 데이터다. 실제 개인정보가 아니다.
// 이 대시보드는 본래 '개인 단위 정보 미사용·집계 전용'이므로(compliance 페이지 참조),
// 이 화면은 오직 데모/샘플 목적의 합성 레코드만 다룬다. 주민등록번호·외국인등록번호는
// 실제로 유효한 번호를 만들지 않고 '뒷자리 마스킹된 합성 포맷'으로만 표시한다(재식별·오용 방지).

export type MockResident = {
  id: number;
  name: string; // 이름(합성)
  gender: "남" | "여";
  birth: string; // 생년월일 YYYY-MM-DD
  rrn: string; // 주민등록번호(마스킹 합성) — YYMMDD-N●●●●●●
  frn: string; // 외국인등록번호(마스킹 합성) — YYMMDD-N●●●●●●
  nationality: string; // 국적(합성)
  visa: string; // 체류자격
  sido: string; // 시/도
  sigungu: string; // 시/군/구
  registeredAt: string; // 등록일 YYYY-MM-DD
};

export const MOCK_TOTAL = 100_000;

// 결정적 PRNG(mulberry32) — 시드 고정으로 렌더마다 동일한 합성 데이터 재현.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 합성 풀(모두 임의 조합용, 실제 인물과 무관) ──
const NATIONALITIES = [
  "중국", "베트남", "태국", "우즈베키스탄", "필리핀", "캄보디아", "네팔", "인도네시아",
  "미얀마", "몽골", "러시아", "방글라데시", "스리랑카", "미국", "일본", "카자흐스탄"
];

// 국적별 합성 이름 풀(로마자, 임의 조합). 정확한 실명 규칙과 무관한 데모용.
const GIVEN: Record<string, string[]> = {
  중국: ["Wei", "Fang", "Min", "Lei", "Jing", "Yan", "Hui", "Bo"],
  베트남: ["Van", "Thi", "Minh", "Anh", "Hoa", "Lan", "Tuan", "Huong"],
  우즈베키스탄: ["Aziz", "Dilnoza", "Jasur", "Nodira", "Bekzod", "Malika"],
  기타: ["Alex", "Maria", "Nurul", "Sanjay", "Rustam", "Ivan", "Sakura", "Batu", "Rin", "Aung"]
};
const SURNAME: Record<string, string[]> = {
  중국: ["Zhang", "Wang", "Li", "Chen", "Liu", "Zhao"],
  베트남: ["Nguyen", "Tran", "Le", "Pham", "Hoang"],
  우즈베키스탄: ["Karimov", "Yusupova", "Ismoilov"],
  기타: ["Kim", "Santos", "Reyes", "Ivanov", "Rahman", "Bat", "Tanaka", "Gurung"]
};

const VISAS = ["E-9", "D-2", "F-6", "F-4", "H-2", "E-7", "D-4", "F-5", "C-3", "E-2", "F-2"];

const REGIONS: [string, string[]][] = [
  ["경기도", ["안산시", "수원시", "화성시", "부천시", "시흥시", "평택시"]],
  ["서울특별시", ["영등포구", "구로구", "금천구", "관악구", "광진구", "동대문구"]],
  ["인천광역시", ["부평구", "남동구", "미추홀구", "서구"]],
  ["충청남도", ["아산시", "천안시", "당진시"]],
  ["경상남도", ["김해시", "창원시", "양산시"]],
  ["부산광역시", ["사하구", "부산진구", "강서구"]],
  ["경상북도", ["경주시", "구미시", "포항시"]],
  ["전라남도", ["여수시", "순천시", "영암군"]]
];

const pick = <T>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

// 마스킹 합성 주민/외국인등록번호: YYMMDD-N●●●●●● (뒷 6자리 마스킹 = 실제 유효번호 아님).
function maskedId(yy: string, mm: string, dd: string, genderDigit: number): string {
  return `${yy}${mm}${dd}-${genderDigit}●●●●●●`;
}

// index i 하나의 합성 레코드를 결정적으로 생성.
export function mockResidentAt(i: number): MockResident {
  const r = mulberry32(0x9e3779b9 ^ (i * 2654435761));
  const nat = pick(r, NATIONALITIES);
  const gk = GIVEN[nat] ? nat : "기타";
  const sk = SURNAME[nat] ? nat : "기타";
  const name = `${pick(r, SURNAME[sk])} ${pick(r, GIVEN[gk])}`;
  const isMale = r() < 0.5;
  const gender: "남" | "여" = isMale ? "남" : "여";

  const year = 1962 + Math.floor(r() * 44); // 1962~2005
  const month = 1 + Math.floor(r() * 12);
  const day = 1 + Math.floor(r() * 28);
  const yy = pad(year % 100);
  const mm = pad(month);
  const dd = pad(day);
  const century2000 = year >= 2000;
  // 주민등록번호 성별코드: 1900년대 1(남)/2(여), 2000년대 3(남)/4(여).
  const rrnG = century2000 ? (isMale ? 3 : 4) : isMale ? 1 : 2;
  // 외국인등록번호 성별코드: 1900년대 5/6, 2000년대 7/8.
  const frnG = century2000 ? (isMale ? 7 : 8) : isMale ? 5 : 6;

  const [sido, sigunguList] = pick(r, REGIONS);
  const sigungu = pick(r, sigunguList);

  const regY = 2015 + Math.floor(r() * 11);
  const regM = 1 + Math.floor(r() * 12);
  const regD = 1 + Math.floor(r() * 28);

  return {
    id: i + 1,
    name,
    gender,
    birth: `${year}-${mm}-${dd}`,
    rrn: maskedId(yy, mm, dd, rrnG),
    frn: maskedId(yy, mm, dd, frnG),
    nationality: nat,
    visa: pick(r, VISAS),
    sido,
    sigungu,
    registeredAt: `${regY}-${pad(regM)}-${pad(regD)}`
  };
}

// 전체 합성 셋 생성(기본 10만 건). 클라이언트에서 1회 생성해 조회/필터/페이지네이션에 사용.
export function generateMockResidents(count: number = MOCK_TOTAL): MockResident[] {
  const out: MockResident[] = new Array(count);
  for (let i = 0; i < count; i += 1) out[i] = mockResidentAt(i);
  return out;
}

export const NATIONALITY_OPTIONS = NATIONALITIES;
export const SIDO_OPTIONS = REGIONS.map(([s]) => s);
