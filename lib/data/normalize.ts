export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function normalizeCollection<T>(
  rows: T[],
  selector: (row: T) => number
): Map<T, number> {
  const values = rows.map(selector);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return new Map(rows.map((row) => [row, normalize(selector(row), min, max)]));
}
