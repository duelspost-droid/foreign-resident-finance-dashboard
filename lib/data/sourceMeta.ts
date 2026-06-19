// 수집 소스 공통 메타: 대상 도메인 라벨 + 화면 연동 매핑.
// 승인 큐(SourceApprovalQueue)·메타데이터 관리·수집 원본 뷰어가 공유한다(중복 정의 방지).

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

// 수집 소스 id → 현재 반영 중인 대시보드 화면(커버리지 투명성). 없으면 "수집만(미연동)".
export const SURFACED: Record<string, string> = {
  moj_foreign_resident_status_2024: "국적·체류자격·기회점수",
  moj_foreign_stay_data_2024: "지역 분석",
  moj_foreign_student_stay_2024: "대학/유학생",
  academyinfo_foreign_student_count: "대학별 랭킹",
  mois_foreign_resident_region_file: "시군구 외국인주민",
  kosis_foreigner_economic_activity: "체류자격(보조)"
};
