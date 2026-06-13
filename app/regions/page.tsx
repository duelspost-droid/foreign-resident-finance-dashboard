import { FilterBar } from "@/components/layout/FilterBar";
import { RegionMap } from "@/components/charts/RegionMap";
import { RankingTable } from "@/components/charts/RankingTable";
import { ScoreRadarChart } from "@/components/charts/ScoreRadarChart";
import { sampleOpportunityRows } from "@/lib/data/mockData";

export default function RegionsPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">지역 분석</p>
        <h2 className="page-title">지역별 외국인 분포와 금융 기회</h2>
        <p className="page-description">
          시도·시군구 단위의 집계 데이터를 기준으로 외국인 밀집도, 세그먼트, 송금·유학생·급여계좌
          수요를 비교합니다.
        </p>
      </section>

      <FilterBar
        filters={[
          { label: "기준월", options: ["2025.12", "2025.11", "2025.10"] },
          { label: "시도", options: ["전체", "서울특별시", "경기도", "충청남도", "부산광역시"] },
          { label: "국적", options: ["전체", "중국", "베트남", "우즈베키스탄", "몽골"] },
          { label: "체류자격", options: ["전체", "D-2", "E-9", "F-4", "E-7"] },
          { label: "점수 유형", options: ["전체 기회", "송금", "유학생", "급여계좌"] }
        ]}
      />

      <section className="section-grid">
        <div className="surface">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">대한민국 지역 히트맵 placeholder</h3>
              <p className="surface-subtitle">GeoJSON 연결 전 단계의 시군구 우선순위 타일</p>
            </div>
          </div>
          <RegionMap />
        </div>

        <div className="surface">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">점수 유형별 비교</h3>
              <p className="surface-subtitle">대표 지역 3곳의 금융 니즈 구조</p>
            </div>
          </div>
          <div className="chart-box">
            <ScoreRadarChart />
          </div>
        </div>
      </section>

      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">지역 랭킹 테이블</h3>
            <p className="surface-subtitle">클릭 상세 패널은 다음 단계에서 실제 지도와 연결합니다.</p>
          </div>
        </div>
        <div className="p-2">
          <RankingTable rows={sampleOpportunityRows} />
        </div>
      </section>
    </>
  );
}
