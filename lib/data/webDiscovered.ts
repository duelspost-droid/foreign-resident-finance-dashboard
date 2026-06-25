// AI 웹 발굴 에이전트 결과 리더.
// scripts/discover_web_sources.mjs 가 생성하는 webDiscoveredSources.json 을 타입과 함께 노출한다.
// ⚠️ 이 리드들은 '사람이 검토할 외부 후보'다. 자동 수집 대상이 아니다(임의 URL 자동 ingest 금지).
import raw from "./generated/webDiscoveredSources.json";

export type WebLeadDomain =
  | "체류·인구"
  | "유학생"
  | "고용·소득"
  | "송금·환전"
  | "금융이용"
  | "다문화·가족"
  | "사회보험"
  | "지역·지자체"
  | "거시·정책";

export type WebLead = {
  title: string;
  provider: string;
  url: string;
  scope: "국내" | "해외" | "국제기구";
  domain: WebLeadDomain;
  dataType: "통계표" | "API" | "파일(CSV/XLSX)" | "대시보드" | "보고서/PDF" | "마이크로데이터";
  accessMethod: "공개 API" | "KOSIS" | "data.go.kr 활용신청" | "파일 다운로드" | "웹/대시보드" | "수동/문의";
  cadence: string;
  relevance: string;
  suggestedTarget: string;
  piiRisk: "낮음" | "중간" | "높음";
  confidence: "high" | "med" | "low";
};

export type WebDiscovery = {
  version: number;
  generatedAt: string | null;
  source: "ai" | "fallback" | "none";
  model: string | null;
  leads: WebLead[];
  domains: { domain: string; count: number }[];
};

const data = raw as WebDiscovery;

export const webDiscovery: WebDiscovery = data;
export const webLeads: WebLead[] = Array.isArray(data.leads) ? data.leads : [];
export const hasWebLeads = webLeads.length > 0;

// 확신도 순(high>med>low), 그 안에서 도메인·기관명 순.
const CONF_RANK: Record<WebLead["confidence"], number> = { high: 0, med: 1, low: 2 };
export const webLeadsSorted: WebLead[] = [...webLeads].sort(
  (a, b) =>
    CONF_RANK[a.confidence] - CONF_RANK[b.confidence] ||
    a.domain.localeCompare(b.domain) ||
    a.provider.localeCompare(b.provider)
);

export function webLeadsByDomain(): { domain: string; leads: WebLead[] }[] {
  const order = (data.domains ?? []).map((d) => d.domain);
  const map = new Map<string, WebLead[]>();
  for (const l of webLeadsSorted) {
    const arr = map.get(l.domain) ?? [];
    arr.push(l);
    map.set(l.domain, arr);
  }
  const keys = [...map.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return keys.map((domain) => ({ domain, leads: map.get(domain) ?? [] }));
}
