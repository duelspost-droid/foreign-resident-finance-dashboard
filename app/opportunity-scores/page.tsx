import { BarChart3, Globe, MapPin, TrendingUp } from "lucide-react";

import { Panel } from "@/components/ui/Panel";
import { PageHero } from "@/components/ui/PageHero";
import { StatTile } from "@/components/ui/StatTile";
import { RealSidoOpportunityTable } from "@/components/data/RealSidoOpportunityTable";
import { SidoScoreCompositionChart } from "@/components/charts/SidoScoreCompositionChart";
import {
  hasRealSidoOpportunity,
  realSidoOpportunity
} from "@/lib/data/opportunityReal";
import { sidoForeignerTotal, sidoForeignerLatestYear } from "@/lib/data/regionAggregates";
import { formatNumber } from "@/lib/utils/format";

export default function OpportunityScoresPage() {
  // 실데이터 시도 통계
  const topSido = realSidoOpportunity[0];
  const fastestSido = hasRealSidoOpportunity
    ? [...realSidoOpportunity].filter((r) => r.yoy != null).sort((a, b) => (b.yoy ?? 0) - (a.yoy ?? 0))[0]
    : null;

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="금융 기회 점수"
        title="전략 실행 우선순위 랭킹"
        description="외국인 규모, 송금 수요, 유학생 수요, 급여계좌 수요, 다국어 상담 필요도를 0~100으로 정규화하고 설명 가능한 가중치로 전체 기회 점수를 산출합니다."
      />

      {/* 실데이터 시도 기회 점수 (행안부 외국인주민 + KEDI 유학생 + 증가율) */}
      <RealSidoOpportunityTable />

      {/* 기회점수 구성 차트 — 규모·유학생·성장 가중 기여도 */}
      {hasRealSidoOpportunity && (
        <Panel
          title="시도별 기회점수 구성 분해"
          subtitle="각 막대 = 규모(×50%) + 유학생(×30%) + 성장(×20%) 가중 기여도 합산 · 끝의 숫자는 종합 점수"
          right={
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#0f766e" }} />규모</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#3157a4" }} />유학생</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: "#be123c" }} />성장</span>
            </div>
          }
          bodyClassName="p-0"
        >
          <div style={{ height: 560 }} className="px-4 py-4">
            <SidoScoreCompositionChart />
          </div>
        </Panel>
      )}

      <div className="stat-grid">
        <StatTile
          label="분석 시도 수"
          value={hasRealSidoOpportunity ? realSidoOpportunity.length : "—"}
          unit={hasRealSidoOpportunity ? "개 시도" : ""}
          accent="#0f766e"
          icon={<MapPin size={18} />}
          sub={hasRealSidoOpportunity ? "행안부 실데이터 17개 시도" : "실데이터 수집 전"}
        />
        <StatTile
          label="1위 시도 (기회점수)"
          value={hasRealSidoOpportunity && topSido ? topSido.sido : "—"}
          accent="#3157a4"
          icon={<Globe size={18} />}
          trend={hasRealSidoOpportunity && topSido
            ? { label: `종합 ${topSido.overallScore}점`, dir: "up" }
            : undefined}
          sub={hasRealSidoOpportunity && topSido
            ? `외국인주민 ${formatNumber(topSido.residentCount)}명 · 유학생 ${formatNumber(topSido.studentCount)}명`
            : "실데이터 수집 전"}
        />
        <StatTile
          label="전국 외국인주민"
          value={hasRealSidoOpportunity ? formatNumber(sidoForeignerTotal) : "—"}
          unit={hasRealSidoOpportunity ? "명" : ""}
          accent="#b45309"
          icon={<BarChart3 size={18} />}
          sub={hasRealSidoOpportunity
            ? `행안부 시도별${sidoForeignerLatestYear ? ` ${sidoForeignerLatestYear}년` : ""}`
            : "실데이터 수집 전"}
        />
        <StatTile
          label="최고 성장 시도"
          value={hasRealSidoOpportunity && fastestSido ? fastestSido.sido : "—"}
          accent="#be123c"
          icon={<TrendingUp size={18} />}
          trend={hasRealSidoOpportunity && fastestSido?.yoy != null
            ? { label: "전년 대비", dir: "up" }
            : undefined}
          sub={hasRealSidoOpportunity && fastestSido?.yoy != null
            ? `YoY +${fastestSido.yoy.toFixed(1)}%`
            : "실데이터 수집 전"}
        />
      </div>

      <Panel
        title="점수 산식 설명"
        subtitle="0~100 정규화 후 설명 가능한 가중치로 합성한 전체 기회 점수입니다."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm leading-relaxed text-muted">
            <p>
              각 세부 지표(송금·유학생·급여계좌·다국어)는 지역 간 상대값을 0~100으로 정규화한 뒤,
              사업 우선순위에 맞춘 가중치로 합산해 전체 기회 점수를 만듭니다.
            </p>
            <p>
              내부 금융 데이터가 없을 때는 체류자격·국적 집중도·성장률 등 공개 집계 지표로 대체
              점수를 산출하여, 개인 단위 정보 없이도 시장 기회를 비교할 수 있습니다.
            </p>
          </div>
          <div className="tag-list self-start">
            <span className="tag" style={{ borderColor: "#0f766e", color: "#0f766e" }}>
              송금 · remittanceNeedScore
            </span>
            <span className="tag" style={{ borderColor: "#3157a4", color: "#3157a4" }}>
              유학생 · studentFinanceScore
            </span>
            <span className="tag" style={{ borderColor: "#b45309", color: "#b45309" }}>
              급여계좌 · payrollNeedScore
            </span>
            <span className="tag" style={{ borderColor: "#be123c", color: "#be123c" }}>
              다국어 · multilingualCsScore
            </span>
            <span className="tag">전체 · overallOpportunityScore</span>
          </div>
        </div>
      </Panel>

    </div>
  );
}
