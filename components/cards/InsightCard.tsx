export function InsightCard({
  title,
  body,
  score
}: {
  title: string;
  body: string;
  score?: number;
}) {
  return (
    <article className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {typeof score === "number" ? (
          <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">
            {score.toFixed(1)}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{body}</p>
    </article>
  );
}
