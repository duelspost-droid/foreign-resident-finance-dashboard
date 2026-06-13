import { Banknote, GraduationCap, Languages, TrendingUp, Users } from "lucide-react";
import { FilterBar } from "@/components/layout/FilterBar";
import { MetricCard } from "@/components/cards/MetricCard";
import { InsightCard } from "@/components/cards/InsightCard";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { RankingTable } from "@/components/charts/RankingTable";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import {
  kpiSummary,
  sampleOpportunityRows,
  sampleRegionInsights
} from "@/lib/data/mockData";
import { formatNumber, formatScore } from "@/lib/utils/format";

export default function DashboardPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">MVP 대시보드</p>
        <h2 className="page-title">국내거주 외국인 금융 인사이트 대시보드</h2>
        <p className="page-description">
          공개 통계와 내부 금융 집계 데이터를 개인이 아닌 지역·국적·체류자격·대학
          단위로 결합해 금융 상품 기획, 마케팅, 지점 전략을 검토하는 분석 화면입니다.
        </p>
      </section>

      <FilterBar />

      <section className="metric-grid">
        <MetricCard
          title="총 체류외국인 규모"
          value={`${formatNumber(kpiSummary.totalResidents)}명`}
          delta="샘플 지역 집계 기준"
          icon={<Users aria-hidden size={20} />}
        />
        <MetricCard
          title="등록외국인 수"
          value={`${formatNumber(kpiSummary.registeredResidents)}명`}
          delta="장기체류 중심 집계"
          icon={<Banknote aria-hidden size={20} />}
          tone="cobalt"
        />
        <MetricCard
          title="외국인 유학생 수"
          value={`${formatNumber(kpiSummary.foreignStudents)}명`}
          delta="교육부 샘플 대학 데이터"
          icon={<GraduationCap aria-hidden size={20} />}
          tone="amber"
        />
        <MetricCard
          title="평균 금융 기회 점수"
          value={formatScore(kpiSummary.averageOpportunityScore)}
          delta="0~100 정규화 점수"
          icon={<TrendingUp aria-hidden size={20} />}
          tone="berry"
        />
      </section>

      <section className="section-grid">
        <div className="surface">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">금융 기회 점수 TOP 지역</h3>
              <p className="surface-subtitle">지역·국적·세그먼트별 우선순위</p>
            </div>
          </div>
          <div className="p-2">
            <RankingTable rows={sampleOpportunityRows} />
          </div>
        </div>

        <div className="stack">
          {sampleRegionInsights.slice(0, 3).map((insight) => (
            <InsightCard
              body={insight.body}
              key={insight.id}
              score={insight.score}
              title={insight.title}
            />
          ))}
        </div>
      </section>

      <section className="two-column">
        <div className="surface">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">상위 국적 분포</h3>
              <p className="surface-subtitle">샘플 지역 데이터의 국적별 거주자 수</p>
            </div>
          </div>
          <div className="chart-box">
            <NationalityBarChart />
          </div>
        </div>

        <div className="surface">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">월별 유입 추세</h3>
              <p className="surface-subtitle">주요 국적별 6개월 추세 샘플</p>
            </div>
            <Languages aria-hidden className="text-teal-700" size={20} />
          </div>
          <div className="chart-box">
            <TrendLineChart />
          </div>
        </div>
      </section>
    </>
  );
}
