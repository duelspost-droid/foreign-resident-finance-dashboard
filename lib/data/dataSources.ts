export type DataSourceItem = {
  name: string;
  provider: string;
  refreshCycle: string;
  keyColumns: string[];
  usage: string;
  limitation: string;
  sourceUrl: string;
};

export const dataSources: DataSourceItem[] = [
  {
    name: "시군구별 국적별 등록외국인 체류현황",
    provider: "법무부/출입국외국인정책본부",
    refreshCycle: "월 또는 분기 단위 공개 자료 확인 필요",
    keyColumns: ["기준연월", "시도", "시군구", "성별", "국적", "등록외국인수"],
    usage: "지역별·국적별 등록외국인 분포와 금융 접점 우선순위 분석",
    limitation: "등록외국인 중심 자료로 단기체류자나 미등록 체류자는 반영되지 않을 수 있음",
    sourceUrl: "https://www.immigration.go.kr"
  },
  {
    name: "체류외국인 국적 및 체류자격별 현황",
    provider: "법무부/출입국외국인정책본부",
    refreshCycle: "월별 통계 기준",
    keyColumns: ["기준연월", "국적", "체류자격", "체류자격명", "체류외국인수"],
    usage: "체류자격 기반 금융 니즈 세그먼트 산출",
    limitation: "체류자격은 금융행동을 직접 설명하지 않으므로 추천 문구는 가설로 표시해야 함",
    sourceUrl: "https://www.immigration.go.kr"
  },
  {
    name: "외국인주민 현황",
    provider: "행정안전부",
    refreshCycle: "연간",
    keyColumns: ["기준연도", "시도", "시군구", "외국인주민수", "한국국적 취득자", "외국인주민 자녀"],
    usage: "장기거주 외국인 주민 규모와 지역사회 기반 수요 검증",
    limitation: "법무부 체류 통계와 기준이 달라 직접 합산하지 않고 비교 지표로 사용",
    sourceUrl: "https://www.mois.go.kr"
  },
  {
    name: "외국인 유학생 현황",
    provider: "교육부",
    refreshCycle: "연간 또는 학기 단위 공개 자료",
    keyColumns: ["기준연도", "대학명", "소재지", "국적", "학위과정", "외국인유학생수"],
    usage: "대학별·국적별 유학생 금융 수요와 캠퍼스 제휴 우선순위 분석",
    limitation: "캠퍼스 분리 여부와 과정 분류가 파일별로 다를 수 있음",
    sourceUrl: "https://www.moe.go.kr"
  },
  {
    name: "대학알리미 외국인유학생수",
    provider: "한국대학교육협의회 대학알리미",
    refreshCycle: "연간",
    keyColumns: ["기준연도", "대학명", "캠퍼스", "외국인유학생수", "전체학생수"],
    usage: "교육부 유학생 자료 검증과 대학 총량 비교",
    limitation: "국적·과정 세부 분류가 제한될 수 있음",
    sourceUrl: "https://www.academyinfo.go.kr"
  },
  {
    name: "시도별 등록외국인 현황 (KOSIS API)",
    provider: "KOSIS(법무부 출입국통계)",
    refreshCycle: "연간",
    keyColumns: ["기준연도", "시도", "국적", "체류자격", "등록외국인수"],
    usage: "KOSIS 오픈API로 시도·국적 단위 등록외국인 시계열을 자동 수집",
    limitation: "KOSIS_API_KEY 필요. orgId/tblId는 운영 환경 응답으로 확정",
    sourceUrl: "https://kosis.kr/openapi"
  },
  {
    name: "지자체 외국인주민 현황 (data.go.kr API)",
    provider: "행정안전부",
    refreshCycle: "연간",
    keyColumns: ["기준연도", "시도", "시군구", "외국인주민수"],
    usage: "REST 오픈API로 시군구 외국인주민 집계를 자동 수집·검증",
    limitation: "DATA_GO_KR_SERVICE_KEY 필요. endpoint 경로는 운영 환경에서 확정",
    sourceUrl: "https://www.data.go.kr/tcs/dss/selectDataSetList.do?keyword=외국인주민"
  },
  {
    name: "내부 금융 집계 데이터",
    provider: "금융기관 내부 집계",
    refreshCycle: "월간 배치 권장",
    keyColumns: ["기준월", "시도", "시군구", "국적", "세그먼트", "송금건수", "계좌개설수"],
    usage: "공개 통계와 내부 집계 지표를 결합한 실제 금융 기회 점수 보정",
    limitation: "개인 단위 원천 데이터는 대시보드에 적재하지 않고 집계값만 사용",
    sourceUrl: "내부 시스템"
  }
];
