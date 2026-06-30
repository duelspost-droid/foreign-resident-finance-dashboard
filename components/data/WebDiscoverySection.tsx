// AI 웹 발굴 리드 섹션 (data-pipeline 페이지).
// scripts/discover_web_sources.mjs 가 Claude+웹검색으로 전 인터넷에서 발굴한 외국인 데이터 후보를
// 도메인별로 렌더한다. ⚠️ 이 리드는 '사람이 검토할 외부 후보'다 — 수집기가 자동 ingest 하지 않는다.
import { ExternalLink, Globe, ShieldAlert } from "lucide-react";
import { webDiscovery, webLeadsByDomain, hasWebLeads, type WebLead } from "@/lib/data/webDiscovered";

const CONF_TONE: Record<WebLead["confidence"], string> = {
  high: "bg-teal-100 text-teal-800",
  med: "bg-slate-100 text-slate-700",
  low: "bg-amber-100 text-amber-800"
};
const CONF_LABEL: Record<WebLead["confidence"], string> = { high: "확신 높음", med: "확신 보통", low: "확신 낮음" };
const PII_TONE: Record<WebLead["piiRisk"], string> = {
  낮음: "bg-emerald-100 text-emerald-800",
  중간: "bg-amber-100 text-amber-800",
  높음: "bg-rose-100 text-rose-800"
};
const SCOPE_TONE: Record<WebLead["scope"], string> = {
  국내: "bg-indigo-50 text-indigo-700",
  해외: "bg-violet-50 text-violet-700",
  국제기구: "bg-sky-50 text-sky-700"
};

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${tone}`}>{children}</span>;
}

function LeadCard({ lead }: { lead: WebLead }) {
  return (
    <li className="rounded-md border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-ink">{lead.title}</p>
        <a
          className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs text-teal-700 hover:underline"
          href={lead.url}
          rel="noreferrer"
          target="_blank"
        >
          출처 <ExternalLink aria-hidden size={11} />
        </a>
      </div>
      <p className="text-xs text-muted">{lead.provider}</p>
      <p className="mt-1.5 text-sm text-slate-700">{lead.relevance}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <Badge tone={SCOPE_TONE[lead.scope]}>{lead.scope}</Badge>
        <Badge tone="bg-slate-100 text-slate-700">{lead.dataType}</Badge>
        <Badge tone="bg-slate-100 text-slate-700">{lead.accessMethod}</Badge>
        <Badge tone={PII_TONE[lead.piiRisk]}>PII {lead.piiRisk}</Badge>
        <Badge tone={CONF_TONE[lead.confidence]}>{CONF_LABEL[lead.confidence]}</Badge>
      </div>
      {lead.suggestedTarget && (
        <p className="mt-1.5 text-xs text-slate-500">
          추정 활용축: <span className="text-slate-700">{lead.suggestedTarget}</span>
          {lead.cadence ? ` · 갱신 ${lead.cadence}` : ""}
        </p>
      )}
    </li>
  );
}

export function WebDiscoverySection() {
  const groups = webLeadsByDomain();
  return (
    <section className="surface mt-4">
      <div className="surface-header">
        <div className="flex items-center gap-2">
          <Globe aria-hidden className="text-teal-700" size={18} />
          <div>
            <h3 className="surface-title">AI 웹 발굴 리드 · 전 인터넷</h3>
            <p className="surface-subtitle">
              Claude + 웹 검색으로 data.go.kr 밖(KOSIS·한국은행·지자체·OECD·World Bank 등)까지 외국인 데이터 후보를 발굴합니다.
            </p>
          </div>
        </div>
        {webDiscovery.generatedAt && (
          <span className="text-xs text-slate-500">
            발굴 {webDiscovery.leads.length}건 · {new Date(webDiscovery.generatedAt).toLocaleString("ko-KR")}
          </span>
        )}
      </div>

      {/* 안전 고지: 자동 수집 금지 */}
      <div className="mx-2 mt-2 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <ShieldAlert aria-hidden size={14} className="mt-0.5 shrink-0" />
        <p>
          자동수집 가능(data.go.kr)·PII낮음 리드는 <strong>위 승인 큐에 후보로 자동 적재</strong>되어 승인 시 다음 배치가 수집합니다.
          그 외(국제기구·대시보드·PDF 등)는 수집기가 <strong>자동 수집하지 않으며</strong>(임의 URL fetch 차단), 아래에서 검토 후 수동 처리합니다.
        </p>
      </div>

      {!hasWebLeads ? (
        <p className="px-3 py-6 text-center text-sm text-muted">
          아직 AI 웹 발굴 결과가 없습니다. <code className="rounded bg-slate-100 px-1">ANTHROPIC_API_KEY</code> 설정 시 매일 배치에서
          자동 발굴됩니다. (로컬: <code className="rounded bg-slate-100 px-1">npm run data:discover</code>)
        </p>
      ) : (
        <div className="space-y-4 p-2">
          {groups.map((g) => (
            <div key={g.domain}>
              <p className="mb-1.5 px-1 text-sm font-bold text-ink">
                {g.domain} <span className="text-xs font-normal text-slate-400">({g.leads.length})</span>
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {g.leads.map((lead) => (
                  <LeadCard key={lead.url} lead={lead} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
