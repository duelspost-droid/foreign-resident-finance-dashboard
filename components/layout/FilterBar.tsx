type FilterOption = {
  label: string;
  options: string[];
};

const defaultFilters: FilterOption[] = [
  { label: "기준연도", options: ["2025", "2024", "2023"] },
  { label: "기준월", options: ["12월", "11월", "10월"] },
  { label: "시도", options: ["전체", "서울특별시", "경기도", "충청남도", "부산광역시"] },
  { label: "국적", options: ["전체", "중국", "베트남", "우즈베키스탄", "몽골"] },
  {
    label: "세그먼트",
    options: ["전체", "유학생", "비전문취업 근로자", "재외동포", "전문인력"]
  }
];

export function FilterBar({
  filters = defaultFilters
}: {
  filters?: FilterOption[];
}) {
  return (
    <div className="surface mb-4 grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-5">
      {filters.map((filter) => (
        <label className="grid gap-1 text-sm font-medium text-slate-700" key={filter.label}>
          <span>{filter.label}</span>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100">
            {filter.options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
