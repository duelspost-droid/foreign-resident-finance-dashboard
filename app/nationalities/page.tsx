import { FilterBar } from "@/components/layout/FilterBar";
import { NationalityBarChart } from "@/components/charts/NationalityBarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { VisaDonutChart } from "@/components/charts/VisaDonutChart";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import {
  nationalityDistributionData,
  sampleResidentStatus
} from "@/lib/data/mockData";
import type { ForeignResidentStatus } from "@/lib/types/foreignResident";
import { formatNumber } from "@/lib/utils/format";

const statusColumns: DataTableColumn<ForeignResidentStatus>[] = [
  { header: "국적", accessor: (row) => row.nationality },
  { header: "체류자격", accessor: (row) => `${row.visaCode} ${row.visaName}` },
  { header: "세그먼트", accessor: (row) => row.segmentType },
  {
    header: "인원",
    accessor: (row) => `${formatNumber(row.residentCount)}명`,
    align: "right"
  },
  {
    header: "금융 니즈",
    accessor: (row) => (
      <span className="tag-list">
        {row.financialNeedTags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </span>
    )
  }
];

export default function NationalitiesPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">국적 분석</p>
        <h2 className="page-title">국적별 체류 구조와 금융 니즈</h2>
        <p className="page-description">
          국적별 거주지역, 체류자격, 월별 증가 추세를 비교하고 계좌개설, 송금, 체크카드,
          자산관리 같은 니즈 태그를 확인합니다.
        </p>
      </section>

      <FilterBar
        filters={[
          { label: "국적", options: ["중국", "베트남", "우즈베키스탄", "몽골", "전체"] },
          { label: "기준연도", options: ["2025", "2024", "2023"] },
          { label: "시도", options: ["전체", "서울특별시", "경기도", "충청남도"] },
          { label: "세그먼트", options: ["전체", "유학생", "비전문취업 근로자", "재외동포"] }
        ]}
      />

      <section className="two-column">
        <div className="surface">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">국적별 지역 분포</h3>
              <p className="surface-subtitle">상위 국적의 샘플 거주자 수</p>
            </div>
          </div>
          <div className="chart-box">
            <NationalityBarChart data={nationalityDistributionData} />
          </div>
        </div>

        <div className="surface">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">체류자격 분포</h3>
              <p className="surface-subtitle">세그먼트 비중 샘플</p>
            </div>
          </div>
          <div className="chart-box">
            <VisaDonutChart />
          </div>
        </div>
      </section>

      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">월별 증가 추세</h3>
            <p className="surface-subtitle">국적별 체류외국인 월별 추세</p>
          </div>
        </div>
        <div className="chart-box">
          <TrendLineChart />
        </div>
      </section>

      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">국적별 체류자격과 금융 니즈 태그</h3>
            <p className="surface-subtitle">체류자격은 금융행동의 직접 증거가 아닌 세그먼트 가설입니다.</p>
          </div>
        </div>
        <div className="p-2">
          <DataTable
            columns={statusColumns}
            rowKey={(row) => row.id}
            rows={sampleResidentStatus}
          />
        </div>
      </section>
    </>
  );
}
