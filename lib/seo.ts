// 라우트별 SEO 메타데이터 단일 출처. 각 server page 가 pageMetadata("/route") 로 사용.
// (Header.pageNames 와 별개 — Header 는 client 컴포넌트라 server metadata 로 재사용 불가하므로
//  여기서 검색용 title/description 을 따로 큐레이션한다.)
import type { Metadata } from "next";

export const SITE = {
  name: "외국인 금융 인사이트",
  shortName: "외국인 금융 인사이트",
  url: "https://data.jbax.co.kr",
  description:
    "집계 단위 외국인 통계와 금융 집계 데이터를 기반으로 국내 거주 외국인 금융 시장 기회를 분석하는 B2B 대시보드"
};

// 공개(색인 허용) 라우트 → 검색용 제목·설명. 관리자(/admin*)는 제외(noindex).
export const routeMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "대시보드",
    description:
      "국내 거주 외국인 금융 시장 핵심 지표 — 체류·등록 외국인, 유학생, 지역별 기회 점수, 국적·체류자격 분포를 한 화면에 집계."
  },
  "/financial-insights": {
    title: "금융 인사이트",
    description:
      "외국인 대상 은행·캐피탈 시장 기회, 지역 전략, 세그먼트별 유스케이스와 매일 갱신되는 금융 인사이트."
  },
  "/catalog": {
    title: "데이터 카탈로그",
    description: "대시보드가 수집하는 외국인 통계 데이터셋 색인 — 출처·카테고리·활용축별 분류."
  },
  "/nationalities": {
    title: "국적 분석",
    description: "국적·연령대별 체류 외국인 분포와 규모 — 국적 단위 금융 고객 세그먼트 분석."
  },
  "/regions": {
    title: "지역 분석",
    description: "시도별 외국인주민 분포와 금융 기회 점수 — 지역 단위 시장 규모·성장률 비교."
  },
  "/economy": {
    title: "경제활동·소득",
    description:
      "외국인 임금·고용형태·산업·연령별 경제활동과 EPS 도입·건강보험 — 소득·지불능력 지표."
  },
  "/universities": {
    title: "유학생",
    description:
      "외국인 유학생 추이·국적·대학·시도별 분포 — 유학생 금융(학자금·송금·환전) 수요 분석."
  },
  "/consumption": {
    title: "소비·금융거래",
    description:
      "외국인 면세점 소비·부동산 취득·본국송금(이전소득수지)·환율 등 소비·금융거래 지표."
  },
  "/visa-segments": {
    title: "비자 세그먼트",
    description: "체류자격(비자)별 인원과 금융 니즈 세그먼트 — 비자 유형별 상품 타깃팅."
  },
  "/opportunity-scores": {
    title: "기회 점수",
    description: "시도별 금융 기회 점수 순위와 산출 근거 — 규모·유학생·성장률 가중 합성."
  },
  "/compliance": {
    title: "컴플라이언스",
    description: "집계 통계 원칙과 개인정보 비식별 — 소수 셀 마스킹 등 데이터 거버넌스."
  },
  "/data-pipeline": {
    title: "메타데이터 관리",
    description: "공공데이터 수집 파이프라인 상태·발굴 에이전트·데이터 리니지와 커버리지."
  }
};

// 색인 대상 공개 라우트 목록(sitemap·robots 용).
export const publicRoutes = Object.keys(routeMeta);

// server page 의 `export const metadata = pageMetadata("/route")` 로 사용.
export function pageMetadata(path: string): Metadata {
  const m = routeMeta[path] ?? { title: SITE.name, description: SITE.description };
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE.name,
      url: path,
      title: `${m.title} · ${SITE.name}`,
      description: m.description
    }
  };
}
