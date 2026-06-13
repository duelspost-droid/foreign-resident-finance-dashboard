export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

export function formatCurrencyKrw(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억원`;
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}만원`;
  }

  return `${formatNumber(value)}원`;
}
