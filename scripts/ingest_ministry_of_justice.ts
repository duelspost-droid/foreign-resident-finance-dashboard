/**
 * TODO: 법무부/출입국외국인정책본부 공개 통계 수집 스크립트.
 *
 * MVP에서는 화면 구조와 분석 흐름을 먼저 구현하므로 실제 네트워크 수집은 제외한다.
 * 다음 단계에서 공공데이터 포털 또는 법무부 원천 파일 URL을 확정한 뒤 CSV/XLSX 파서를 연결한다.
 */
export async function ingestMinistryOfJustice() {
  return {
    source: "법무부/출입국외국인정책본부",
    status: "not_connected",
    nextStep: "원천 파일 또는 API URL 확정 후 Supabase upsert 연결"
  };
}
