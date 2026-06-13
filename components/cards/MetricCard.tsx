import type { ReactNode } from "react";

export function MetricCard({
  title,
  value,
  delta,
  icon,
  tone = "teal"
}: {
  title: string;
  value: string;
  delta?: string;
  icon: ReactNode;
  tone?: "teal" | "berry" | "amber" | "cobalt";
}) {
  const toneClasses = {
    teal: "bg-teal-50 text-teal-800",
    berry: "bg-rose-50 text-rose-800",
    amber: "bg-amber-50 text-amber-800",
    cobalt: "bg-blue-50 text-blue-800"
  };

  return (
    <article className="surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClasses[tone]}`}>
          {icon}
        </span>
      </div>
      {delta ? <p className="mt-3 text-sm text-slate-600">{delta}</p> : null}
    </article>
  );
}
