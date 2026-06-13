import type {
  ForeignResidentSegment,
  RegionOpportunityRow
} from "@/lib/types/foreignResident";
import type { UniversityOpportunity } from "@/lib/types/university";

export function generateRegionInsight(region: {
  sido: string;
  sigungu: string;
  topNationality: string;
  dominantSegment: ForeignResidentSegment;
  overallOpportunityScore: number;
}) {
  if (region.dominantSegment === "비전문취업 근로자") {
    return `${region.sido} ${region.sigungu}는 ${region.topNationality} 국적 근로자 비중이 높은 지역입니다. 급여계좌, 본국송금, 다국어 상담 캠페인을 우선 검토하세요.`;
  }

  if (region.dominantSegment === "유학생") {
    return `${region.sido} ${region.sigungu}는 ${region.topNationality} 국적 유학생 금융 수요가 높은 지역입니다. 신학기 계좌개설, 체크카드, 등록금 납부 안내 캠페인이 적합합니다.`;
  }

  if (region.dominantSegment === "재외동포") {
    return `${region.sido} ${region.sigungu}는 장기거주 가능성이 높은 외국국적동포 수요가 있습니다. 신용카드, 주거금융, 자산관리 상품을 검토하세요.`;
  }

  return `${region.sido} ${region.sigungu}는 외국인 금융 수요가 관찰되는 지역입니다. 국적별 언어 지원과 기본 생활금융 상품을 우선 검토하세요.`;
}

export function generateOpportunityAction(row: RegionOpportunityRow) {
  if (row.remittanceNeedScore >= 75) {
    return "송금 수수료 우대, 급여계좌 제휴, 현장 상담 데스크를 묶은 캠페인";
  }

  if (row.studentFinanceScore >= 70) {
    return "신학기 계좌개설 부스, 체크카드 안내문, 등록금 납부 가이드";
  }

  if (row.multilingualCsScore >= 70) {
    return "다국어 상담 리소스 보강과 모바일앱 외국어 설정 안내";
  }

  return "지역별 언어 안내와 기본 생활금융 패키지 테스트";
}

export function generateUniversityCampaign(university: UniversityOpportunity) {
  const top = university.topNationalities.slice(0, 2).join("·");
  return `${university.universityName}은 ${top} 유학생 접점이 큽니다. 신학기 계좌개설, 체크카드 안내, 해외송금 수수료 우대 캠페인을 우선 배치하세요.`;
}

export const segmentRecommendationMap: Record<
  ForeignResidentSegment,
  {
    products: string[];
    channels: string[];
    risks: string[];
  }
> = {
  유학생: {
    products: ["계좌개설", "체크카드", "등록금 납부", "해외송금"],
    channels: ["대학 제휴 부스", "입학처 안내문", "모바일 외국어 페이지"],
    risks: ["학기 초 단기 피크", "소수 국적 셀 재식별"]
  },
  어학연수생: {
    products: ["계좌개설", "체크카드", "생활비 송금", "환전"],
    channels: ["어학당 오리엔테이션", "캠퍼스 ATM", "외국어 채팅 상담"],
    risks: ["체류기간 변동", "단기 이탈률"]
  },
  "비전문취업 근로자": {
    products: ["급여계좌", "본국송금", "소액저축", "보험"],
    channels: ["공단 제휴", "사업장 방문", "주말 상담"],
    risks: ["과도한 신용공급", "고용 변동성"]
  },
  전문인력: {
    products: ["급여계좌", "신용카드", "고액송금", "자산관리"],
    channels: ["기업 HR 제휴", "프리미엄 상담", "영문 앱 안내"],
    risks: ["국가별 세무 규정", "고액 송금 모니터링"]
  },
  재외동포: {
    products: ["장기거주 금융", "신용카드", "주거금융", "자산관리"],
    channels: ["동포 커뮤니티 제휴", "지역 지점", "부동산 금융 상담"],
    risks: ["거주 상태 확인", "부동산 관련 규제"]
  },
  결혼이민: {
    products: ["생활금융", "가족계좌", "보험", "주거금융"],
    channels: ["지자체 센터", "가족 단위 상담", "생활 안내 키트"],
    risks: ["가구 단위 민감정보", "취약계층 보호"]
  },
  단기체류: {
    products: ["환전", "선불카드", "간편결제", "관광소비"],
    channels: ["공항/역세권", "관광지 제휴", "QR 안내"],
    risks: ["단기 체류 목적 혼재", "재방문 추정 제한"]
  },
  기타: {
    products: ["기본 계좌", "체크카드", "외국어 상담"],
    channels: ["지역 지점", "모바일앱", "콜센터"],
    risks: ["세그먼트 해석 한계", "소수 셀 마스킹"]
  }
};
