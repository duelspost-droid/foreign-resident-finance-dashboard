import { sampleOpportunityRows } from "@/lib/data/mockData";
import { formatNumber, formatScore } from "@/lib/utils/format";

export function RegionMap() {
  const rows = sampleOpportunityRows.slice(0, 6);

  return (
    <div className="grid h-full min-h-[320px] gap-3 p-4 sm:grid-cols-2">
      {rows.map((row) => (
        <article
          className="flex min-h-28 flex-col justify-between rounded-md border border-slate-200 bg-slate-50 p-4"
          key={row.id}
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-ink">
                {row.sido} {row.sigungu}
              </h3>
              <span className="rounded-md bg-teal-700 px-2 py-1 text-xs font-bold text-white">
                {formatScore(row.overallOpportunityScore)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {row.topNationality} · {row.dominantSegment}
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted">외국인 수</span>
            <strong>{formatNumber(row.residentCount)}명</strong>
          </div>
        </article>
      ))}
    </div>
  );
}
