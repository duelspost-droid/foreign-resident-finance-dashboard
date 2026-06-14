export const publicDataSources = [
  {
    id: "moj_foreign_resident_status_2024",
    datasetId: "3045188",
    detailPk: "uddi:2183c61a-db54-4844-ae97-a69d1c2ad47b",
    type: "file",
    provider: "법무부",
    title: "체류외국인 국적 및 체류자격별 현황",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_status",
    outputBaseName: "moj_foreign_resident_status_2024"
  },
  {
    id: "moj_foreign_stay_data_2024",
    datasetId: "3069963",
    detailPk: null,
    type: "file",
    provider: "법무부",
    title: "외국인체류데이터",
    baseDate: "2024-12-31",
    targetTable: "foreign_resident_region_month",
    outputBaseName: "moj_foreign_stay_data_2024"
  },
  {
    id: "moj_foreign_student_stay_2024",
    datasetId: "15100038",
    detailPk: null,
    type: "file",
    provider: "법무부",
    title: "연도별 외국인 유학생 체류 현황",
    baseDate: "2024-12-31",
    targetTable: "foreign_student_university",
    outputBaseName: "moj_foreign_student_stay_2024"
  }
];

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
  }
];
