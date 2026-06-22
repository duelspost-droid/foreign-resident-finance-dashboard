export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}

// 기회 점수 → 색상(전 화면 공통). 경계값 72/55/40 단일 기준으로 통일.
export function scoreColor(score: number): string {
  if (score >= 72) return "#0f766e"; // teal — 최우선
  if (score >= 55) return "#3157a4"; // cobalt — 우선
  if (score >= 40) return "#b45309"; // amber — 관찰
  return "#be123c"; // berry — 후순위
}

// 기회 점수 → 구간 라벨(색상 임계값과 동일 경계).
export function scoreTierLabel(score: number): string {
  if (score >= 72) return "최우선";
  if (score >= 55) return "우선";
  if (score >= 40) return "관찰";
  return "후순위";
}

// 소수 셀 마스킹(개인정보 규정 방어): 1~4의 정수 count 셀은 재식별 방지로 '<5' 표시.
// 큐레이션 페이지(공표된 정부 집계)엔 적용하지 않고, 미큐레이션 '범용 원본 뷰어'에만 적용한다.
// 연도(2024)·코드(11 등)·소수(3.5%)는 그대로 둔다(정수 1~4만 대상).
export function maskSmallCell(raw: string): { text: string; masked: boolean } {
  const s = String(raw ?? "").replace(/,/g, "").trim();
  if (!/^\d+$/.test(s)) return { text: raw, masked: false };
  const n = Number(s);
  return n >= 1 && n <= 4 ? { text: "<5", masked: true } : { text: raw, masked: false };
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
