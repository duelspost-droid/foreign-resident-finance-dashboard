"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchSurfaceDispositions } from "@/lib/data/supabaseClient";
import { SURFACED } from "@/lib/data/sourceMeta";
import { dataLineage } from "@/lib/data/generated/dataLineage";
import { type ChartConfig, GenericSourceChart, parseChartConfig } from "@/components/data/GenericSourceChart";
import type { GenericSource } from "@/lib/data/generated/genericData";

type Item = { id: string; title: string; provider?: string; source: GenericSource; config: ChartConfig };

// 홈 '추가 데이터' 섹션 — 관리자가 메타데이터 관리에서 '홈에 표시'(disposition='shown')한
// 소스를 범용 차트/표로 자동 렌더한다. 토글이 없으면 섹션 자체가 보이지 않는다(개발 불필요).
export function HomeExtraData() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    void (async () => {
      const disp = await fetchSurfaceDispositions();
      if (!disp) {
        setItems([]);
        return;
      }
      const ids = Object.entries(disp)
        .filter(([, v]) => v.disposition === "shown")
        .map(([id]) => id)
        // 이미 전용 화면이 있는(SURFACED) 소스는 '추가 데이터'에 중복 노출하지 않는다.
        .filter((id) => !SURFACED[id]);
      if (ids.length === 0) {
        setItems([]);
        return;
      }
      // 토글된 소스가 있을 때만 범용 데이터 번들을 지연 로드(초기 홈 번들 보호).
      const { genericSources } = await import("@/lib/data/generated/genericData");
      const meta = new Map(dataLineage.sources.map((s) => [s.id, s]));
      setItems(
        ids
          .filter((id) => genericSources[id])
          .map((id) => ({
            id,
            title: meta.get(id)?.title ?? id,
            provider: meta.get(id)?.provider,
            source: genericSources[id],
            config: parseChartConfig(disp[id]?.note)
          }))
      );
    })();
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Sparkles size={16} className="text-teal-600" aria-hidden />
        <h2 className="text-sm font-bold text-slate-900">추가 데이터</h2>
        <span className="text-xs text-slate-400">관리자가 ‘메타데이터 관리 → 홈에 표시’로 연결한 데이터</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((s) => (
          <GenericSourceChart key={s.id} title={s.title} provider={s.provider} source={s.source} config={s.config} />
        ))}
      </div>
    </section>
  );
}
