/**
 * TODO: 교육부 외국인 유학생 현황 XLSX/CSV 수집 스크립트.
 *
 * 대학명, 캠퍼스, 소재지, 국적, 과정 구분의 표준화 규칙이 먼저 필요하다.
 */
export async function ingestMinistryOfEducation() {
  return {
    source: "교육부 외국인 유학생 현황",
    status: "not_connected",
    nextStep: "XLSX 컬럼 매핑과 대학명 정규화 테이블 작성"
  };
}
