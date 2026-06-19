// 데이터 신선도 판정 — 일 단위 자동 수집 배치(매일 01:00 KST = 16:00 UTC) 기준.
// ⚠️ now/generatedAt 비교는 반드시 "뷰 시점(클라이언트)"에서 해야 한다.
// 정적 export는 서버 렌더 시각이 빌드 시각으로 고정되므로, 서버에서 계산하면
// 항상 0시간 전(=최신)으로 나와 의미가 없다.

export type FreshLevel = "fresh" | "delayed" | "stale" | "unknown";

export type Freshness = {
  level: FreshLevel;
  color: string;
  bg: string;
  border: string;
  label: string; // 상태 라벨
  ageText: string; // "오늘"·"어제"·"N일 전"
  hours: number;
  days: number;
  detail: string; // 설명 문장
};

// 임계값(시간): 정상<30h, 지연 30~48h, 정체 ≥48h.
// 매일 1회 배치라 정상 상태의 최대 경과는 ~26h(직전 배치 직전) → 30h에 여유.
const FRESH_MAX_H = 30;
const DELAYED_MAX_H = 48;

export function computeFreshness(generatedAt: string, now: number): Freshness {
  const t = new Date(generatedAt).getTime();
  if (!Number.isFinite(t)) {
    return {
      level: "unknown",
      color: "#475569",
      bg: "#f8fafc",
      border: "#e2e8f0",
      label: "확인 불가",
      ageText: "—",
      hours: Infinity,
      days: Infinity,
      detail: "수집 시각을 확인할 수 없습니다."
    };
  }
  const hours = Math.max(0, (now - t) / 3_600_000);
  const days = Math.floor(hours / 24);
  const ageText = hours < 24 ? "오늘" : days === 1 ? "어제" : `${days}일 전`;

  if (hours < FRESH_MAX_H) {
    return {
      level: "fresh",
      color: "#15803d",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      label: "정상 갱신",
      ageText,
      hours,
      days,
      detail: `최근 배치가 ${ageText} 정상 반영됐습니다.`
    };
  }
  if (hours < DELAYED_MAX_H) {
    return {
      level: "delayed",
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fde68a",
      label: "갱신 지연",
      ageText,
      hours,
      days,
      detail: `예상 주기를 1회 놓쳤습니다 — 데이터가 ${ageText} 기준입니다.`
    };
  }
  return {
    level: "stale",
    color: "#be123c",
    bg: "#fef2f2",
    border: "#fecaca",
    label: "갱신 정체",
    ageText,
    hours,
    days,
    detail: `${days}일째 신규 데이터가 반영되지 않았습니다 — 수집 배치 점검이 필요합니다.`
  };
}
