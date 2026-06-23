import { CalendarClock, Sparkles, Newspaper } from "lucide-react";
import digestData from "@/lib/data/generated/insightDigest.json";

// 매일 자동 생성(웹+수집데이터)되는 '금융 인사이트 제안'을 오늘 + 히스토리로 렌더.
// 데이터는 CI 배치가 lib/data/generated/insightDigest.json 에 날짜별 누적(최근 30일)한다.
type Insight = {
  title: string;
  body: string;
  category: string;
  audience: string;
  sources: string[];
};
type DigestDay = { date: string; generatedAt: string; source: string; insights: Insight[] };
const digest = digestData as { version: number; days: DigestDay[] };

const CAT_TONE: Record<string, string> = {
  송금: "bg-blue-100 text-blue-700",
  수신: "bg-teal-100 text-teal-700",
  여신: "bg-amber-100 text-amber-700",
  지역전략: "bg-green-100 text-green-700",
  "규제·컴플라이언스": "bg-rose-100 text-rose-700",
  시장동향: "bg-slate-200 text-slate-700",
  상품기획: "bg-violet-100 text-violet-700"
};
const catTone = (c: string) => CAT_TONE[c] ?? "bg-slate-100 text-slate-600";

function fmtDate(d: string) {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function InsightCardItem({ x }: { x: Insight }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${catTone(x.category)}`}>{x.category}</span>
        {x.audience && x.audience !== "공통" && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">{x.audience}</span>
        )}
      </div>
      <h4 className="text-sm font-bold leading-snug text-slate-900">{x.title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{x.body}</p>
      {x.sources.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
          <Newspaper size={11} aria-hidden className="shrink-0" />
          {x.sources.join(" · ")}
        </p>
      )}
    </article>
  );
}

export function InsightDigest() {
  const days = digest.days ?? [];
  if (days.length === 0) return null;
  const [today, ...history] = days;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-slate-500">
          <Sparkles size={14} aria-hidden className="text-amber-500" /> 오늘의 금융 인사이트 제안
        </h2>
        <span className="text-xs text-muted">
          매일 수집 데이터 + 웹 업계 동향을 결합해 은행·캐피탈 관점으로 자동 제안 · {fmtDate(today.date)}
          {today.source === "data" && " · 데이터 기반"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {today.insights.map((x, i) => (
          <InsightCardItem key={`${today.date}-${i}`} x={x} />
        ))}
      </div>

      {history.length > 0 && (
        <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
            <CalendarClock size={13} aria-hidden /> 지난 인사이트 ({history.length}일)
          </summary>
          <div className="mt-3 space-y-4">
            {history.map((d) => (
              <div key={d.date}>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {fmtDate(d.date)}{d.source === "data" && " · 데이터 기반"}
                </p>
                <ul className="space-y-1.5">
                  {d.insights.map((x, i) => (
                    <li key={`${d.date}-${i}`} className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
                      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${catTone(x.category)}`}>
                        {x.category}
                      </span>
                      <span><strong className="text-slate-800">{x.title}</strong> — {x.body}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
