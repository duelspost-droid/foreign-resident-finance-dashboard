export type ActiveFilters = {
  sido?: string;
  nationality?: string;
  segment?: string;
};

export const FILTER_META: Record<
  keyof ActiveFilters,
  { label: string; color: string }
> = {
  sido:        { label: "시도",      color: "teal" },
  nationality: { label: "국적",      color: "blue" },
  segment:     { label: "세그먼트",  color: "violet" },
};

export function parseFilters(
  params: Record<string, string | string[] | undefined>
): ActiveFilters {
  const get = (key: string) => {
    const v = params[key];
    const s = Array.isArray(v) ? v[0] : v;
    return s && s !== "전체" ? s : undefined;
  };
  return {
    sido:        get("sido"),
    nationality: get("nationality"),
    segment:     get("segment"),
  };
}

export function hasActiveFilters(f: ActiveFilters): boolean {
  return Object.values(f).some(Boolean);
}
