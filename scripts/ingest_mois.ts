/**
 * TODO: 행정안전부 외국인주민 현황 수집 스크립트.
 *
 * 법무부 체류 통계와 기준이 다르므로 직접 합산하지 않고 검증/보정 지표로 사용한다.
 */
export async function ingestMois() {
  return {
    source: "행정안전부 외국인주민 현황",
    status: "not_connected",
    nextStep: "연도별 파일 URL과 시군구 코드 매핑 확정"
  };
}
