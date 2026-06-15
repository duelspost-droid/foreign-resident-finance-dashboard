import type { ReactNode } from "react";

// 프리미엄 카드 컨테이너. 제목/부제 헤더 + 우측 슬롯 + 본문.
export function Panel({
  title,
  subtitle,
  right,
  children,
  bodyClassName = "p-5 pt-3"
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="surface surface-hover">
      {title ? (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-ink">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
