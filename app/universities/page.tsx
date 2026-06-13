import { GraduationCap, Search } from "lucide-react";
import { MetricCard } from "@/components/cards/MetricCard";
import { FilterBar } from "@/components/layout/FilterBar";
import { DataTable, type DataTableColumn } from "@/components/tables/DataTable";
import {
  sampleUniversityOpportunities,
  sampleUniversityData
} from "@/lib/data/mockData";
import type { UniversityOpportunity } from "@/lib/types/university";
import { formatNumber, formatScore } from "@/lib/utils/format";

const universityColumns: DataTableColumn<UniversityOpportunity>[] = [
  { header: "대학", accessor: (row) => row.universityName },
  { header: "캠퍼스", accessor: (row) => row.campusName ?? "-" },
  { header: "지역", accessor: (row) => `${row.sido} ${row.sigungu}` },
  { header: "주요 국적", accessor: (row) => row.topNationalities.join(", ") },
  {
    header: "유학생 수",
    accessor: (row) => `${formatNumber(row.totalForeignStudents)}명`,
    align: "right"
  },
  {
    header: "주변 외국인 수",
    accessor: (row) => `${formatNumber(row.nearbyResidentCount)}명`,
    align: "right"
  },
  {
    header: "기회 점수",
    accessor: (row) => (
      <span className="font-bold text-teal-800">{formatScore(row.opportunityScore)}</span>
    ),
    align: "right"
  }
];

export default function UniversitiesPage() {
  const totalStudents = sampleUniversityData.reduce(
    (sum, row) => sum + row.studentCount,
    0
  );

  return (
    <>
      <section className="page-header">
        <p className="page-kicker">대학/유학생 분석</p>
        <h2 className="page-title">대학 주변 외국인 유학생 금융 수요</h2>
        <p className="page-description">
          대학별 외국인 유학생 규모와 주변 시군구 외국인 수를 함께 보며 신학기 계좌개설,
          체크카드, 해외송금 캠페인 우선순위를 찾습니다.
        </p>
      </section>

      <div className="surface mb-4 p-4">
        <label className="grid flex-1 gap-1 text-sm font-medium text-slate-700">
          <span>대학명 검색</span>
          <span className="relative">
            <Search
              aria-hidden
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              placeholder="예: 성균관대학교"
            />
          </span>
        </label>
      </div>

      <FilterBar
        filters={[
          { label: "지역", options: ["전체", "서울특별시", "부산광역시", "경기도", "충청남도"] },
          { label: "국적", options: ["전체", "중국", "베트남", "몽골", "우즈베키스탄"] },
          { label: "과정", options: ["전체", "학위과정", "어학연수"] }
        ]}
      />

      <section className="metric-grid">
        <MetricCard
          title="샘플 대학 수"
          value={`${sampleUniversityData.length}개`}
          delta="MVP 샘플 기준"
          icon={<GraduationCap aria-hidden size={20} />}
        />
        <MetricCard
          title="외국인 유학생 수"
          value={`${formatNumber(totalStudents)}명`}
          delta="대학별 샘플 합계"
          icon={<GraduationCap aria-hidden size={20} />}
          tone="cobalt"
        />
        <MetricCard
          title="최고 기회 점수"
          value={formatScore(
            Math.max(...sampleUniversityOpportunities.map((row) => row.opportunityScore))
          )}
          delta="유학생 수와 주변 외국인 수 반영"
          icon={<GraduationCap aria-hidden size={20} />}
          tone="amber"
        />
        <MetricCard
          title="추천 캠페인"
          value="신학기 패키지"
          delta="계좌·카드·송금 묶음"
          icon={<GraduationCap aria-hidden size={20} />}
          tone="berry"
        />
      </section>

      <section className="surface mt-4">
        <div className="surface-header">
          <div>
            <h3 className="surface-title">유학생 금융 기회 대학 랭킹</h3>
            <p className="surface-subtitle">대학별 총량, 주요 국적, 주변 수요를 함께 봅니다.</p>
          </div>
        </div>
        <div className="p-2">
          <DataTable
            columns={universityColumns}
            rowKey={(row) => row.id}
            rows={[...sampleUniversityOpportunities].sort(
              (a, b) => b.opportunityScore - a.opportunityScore
            )}
          />
        </div>
      </section>

      <section className="stack mt-4">
        {sampleUniversityOpportunities.slice(0, 3).map((university) => (
          <article className="surface p-4" key={university.id}>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">
                  {university.universityName} {university.campusName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {university.recommendedCampaign}
                </p>
              </div>
              <span className="w-fit rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                {formatScore(university.opportunityScore)}
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
