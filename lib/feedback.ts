// 제안 접수 상태·카테고리 공통 메타 (제출 위젯 + 관리자 콘솔 공유).
export const REQUEST_STATUS: Record<string, { label: string; tone: string; dot: string }> = {
  received: { label: "접수", tone: "bg-slate-100 text-slate-700", dot: "#64748b" },
  reviewing: { label: "검토중", tone: "bg-amber-100 text-amber-800", dot: "#d97706" },
  answered: { label: "답변완료", tone: "bg-teal-100 text-teal-800", dot: "#0f766e" },
  rejected: { label: "반려", tone: "bg-rose-100 text-rose-700", dot: "#be123c" }
};

export const STATUS_ORDER = ["received", "reviewing", "answered", "rejected"] as const;

export const REQUEST_CATEGORY: Record<string, { label: string; tone: string }> = {
  feature: { label: "기능", tone: "bg-blue-100 text-blue-700" },
  data: { label: "데이터", tone: "bg-violet-100 text-violet-700" }
};

export function statusMeta(status: string) {
  return REQUEST_STATUS[status] ?? { label: status, tone: "bg-slate-100 text-slate-700", dot: "#64748b" };
}
export function categoryMeta(category: string) {
  return REQUEST_CATEGORY[category] ?? { label: category, tone: "bg-slate-100 text-slate-700" };
}
