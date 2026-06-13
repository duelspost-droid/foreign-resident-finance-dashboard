export function RecommendationCard({
  title,
  items,
  note
}: {
  title: string;
  items: string[];
  note?: string;
}) {
  return (
    <article className="surface p-4">
      <h3 className="text-base font-bold text-ink">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm text-slate-700">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-700" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-3 text-xs leading-5 text-muted">{note}</p> : null}
    </article>
  );
}
