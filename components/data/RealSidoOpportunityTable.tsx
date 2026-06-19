import { Panel } from "@/components/ui/Panel";
import {
  OPPORTUNITY_WEIGHTS,
  hasRealSidoOpportunity,
  realSidoOpportunity
} from "@/lib/data/opportunityReal";
import { formatNumber, scoreColor } from "@/lib/utils/format";

// 시도별 실데이터 기회 점수 표(행안부 외국인주민 + KEDI 유학생 + 증가율 가중).
// 기회 점수 페이지·지역 페이지 공용. limit 지정 시 상위 N개만 표시.
export function RealSidoOpportunityTable({ limit }: { limit?: number }) {
  if (!hasRealSidoOpportunity) return null;
  const rows = limit ? realSidoOpportunity.slice(0, limit) : realSidoOpportunity;

  return (
    <Panel
      title="실데이터 기회 점수 · 시도"
      subtitle={`외국인주민 규모(${OPPORTUNITY_WEIGHTS.size}) · 유학생(${OPPORTUNITY_WEIGHTS.student}) · 증가율(${OPPORTUNITY_WEIGHTS.growth}) 가중 — 행안부·KEDI 17개 시도 실집계`}
      right={<span className="eyebrow">실데이터</span>}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-3 py-2.5 text-left text-xs font-bold">#</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold">시도</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">외국인주민</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">유학생</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">증가율</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold">규모·유학·성장</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">종합</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sido} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2.5 font-bold text-muted">{r.rank}</td>
                <td className="px-3 py-2.5 font-semibold text-ink">{r.sido}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-700">{formatNumber(r.residentCount)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-600">{formatNumber(r.studentCount)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                  {r.yoy == null ? "—" : `${r.yoy >= 0 ? "+" : ""}${r.yoy.toFixed(1)}%`}
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1 text-[10px] font-mono text-muted">
                    <span className="rounded bg-teal-50 px-1 py-0.5 text-teal-700">{r.sizeScore}</span>
                    <span className="rounded bg-blue-50 px-1 py-0.5 text-blue-700">{r.studentScore}</span>
                    <span className="rounded bg-amber-50 px-1 py-0.5 text-amber-700">{r.growthScore}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="font-bold" style={{ color: scoreColor(r.overallScore) }}>{r.overallScore}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] leading-5 text-muted">
        점수=각 신호를 17개 시도 내 최댓값 대비 0~100 정규화 후 가중합(증가율은 −5~+15% 구간 매핑). 송금·급여계좌 등
        세부 수요는 시도 단위 실데이터가 없어 제외했습니다.
      </p>
    </Panel>
  );
}
