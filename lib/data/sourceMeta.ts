// 수집 소스 공통 메타: 대상 도메인 라벨 + 화면 연동 매핑.
// 승인 큐(SourceApprovalQueue)·메타데이터 관리·수집 원본 뷰어가 공유한다(중복 정의 방지).

import { dataLineage } from "./generated/dataLineage";

// 대상 도메인(target_table) → 한글 라벨. 키 순서가 승인 큐 셀렉트 순서가 된다.
export const TARGET_TABLE_LABELS: Record<string, string> = {
  foreign_resident_region_month: "지역·월별 외국인",
  foreign_resident_status: "체류자격 현황",
  foreign_student_university: "유학생·대학",
  finance_segment_aggregate: "금융 세그먼트",
  foreign_consumption_aggregate: "소비·금융거래",
  unclassified: "기타·미분류 (수집·보관)"
};

export const TARGET_TABLES = Object.keys(TARGET_TABLE_LABELS);

// 대상 도메인 라벨 조회(미지정/null은 미분류로).
export function targetLabel(t: string | null | undefined): string {
  if (!t || t === "unclassified") return "기타·미분류";
  return TARGET_TABLE_LABELS[t] ?? t;
}

// 도메인별 분류 키워드(추천용). 제목 매칭에 가중치를 더 둔다.
const TARGET_KEYWORDS: { table: string; words: string[] }[] = [
  { table: "foreign_student_university", words: ["유학생", "유학", "대학", "고등교육", "학위", "대학원", "어학연수", "KEDI", "대학알리미"] },
  { table: "foreign_consumption_aggregate", words: ["면세", "면세점", "카드", "매출", "부동산", "토지", "환율", "송금", "소비", "거래", "소득수지", "관광"] },
  { table: "finance_segment_aggregate", words: ["금융", "은행", "계좌", "대출", "보험", "연금", "신용", "예금"] },
  { table: "foreign_resident_status", words: ["체류자격", "비자", "등록외국인", "체류", "불법체류", "출입국", "난민", "국적별"] },
  { table: "foreign_resident_region_month", words: ["외국인주민", "시군구", "시도", "지자체", "읍면동", "지역별", "거주"] }
];

export type TargetSuggestion = { table: string; confidence: "high" | "low"; matched: string[] };

// 후보의 제목·키워드·기관으로 대상 도메인을 추천. 제목 매칭이 있으면 confidence=high.
export function suggestTarget(c: { title?: string | null; keyword?: string | null; provider?: string | null }): TargetSuggestion {
  const title = c.title ?? "";
  const rest = `${c.keyword ?? ""} ${c.provider ?? ""}`;
  let best = { table: "unclassified", score: 0, titleHit: false, matched: [] as string[] };
  for (const { table, words } of TARGET_KEYWORDS) {
    const titleMatched = words.filter((w) => title.includes(w));
    const restMatched = words.filter((w) => rest.includes(w) && !titleMatched.includes(w));
    const score = titleMatched.length * 2 + restMatched.length;
    if (score > best.score) {
      best = { table, score, titleHit: titleMatched.length > 0, matched: [...titleMatched, ...restMatched] };
    }
  }
  if (best.score === 0) return { table: "unclassified", confidence: "low", matched: [] };
  return { table: best.table, confidence: best.titleHit ? "high" : "low", matched: best.matched };
}

// 수집 소스 id → 현재 반영 중인 대시보드 화면.
// 빌드 시 build_real_data.mjs 가 페이지 파일을 스캔해 자동 계산 → dataLineage.surfaced 에 저장.
// 이 파일을 직접 편집하지 말 것 — 소스가 어느 export를 만드는지는 build_real_data.mjs의
// SOURCE_TO_EXPORTS 테이블을 수정하면 된다.
export const SURFACED: Record<string, string> = dataLineage.surfaced;
