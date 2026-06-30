import { pageMetadata } from "@/lib/seo";
import { GraduationCap, Languages, TrendingUp, Users } from "lucide-react";
import { StudentDegreeDonutChart } from "@/components/charts/StudentDegreeDonutChart";
import { StudentHorizontalBarChart } from "@/components/charts/StudentHorizontalBarChart";
import { Panel } from "@/components/ui/Panel";
import { PageHero } from "@/components/ui/PageHero";
import {
  foreignStudentByVisa,
  foreignStudentByYear,
  foreignStudentSummary,
  hasRealStudentData,
  hasRealUniversityData,
  sampleUniversityOpportunities,
  universityRanking,
  universitySummary
} from "@/lib/data/mockData";
import {
  realDataSummary,
  realForeignStudentNationality,
  realKediStudentRegion
} from "@/lib/data/generated/realData";
import { formatNumber, formatScore } from "@/lib/utils/format";

// 도넛 차트 팔레트(레전드와 동일 순서로 공유).
const DEGREE_COLORS = [
  "#0f766e",
  "#3157a4",
  "#b45309",
  "#be123c",
  "#0891b2",
  "#7c3aed",
  "#64748b",
  "#9333ea",
  "#16a34a",
  "#d97706",
  "#475569",
  "#db2777"
];

// 체류자격 표기 정리: "유학D2" → "유학 (D-2)" 형태로 보기 좋게.
function prettyVisa(raw: string): string {
  const m = raw.match(/^(.*?)(D\d+)$/);
  if (!m) return raw;
  const code = m[2].replace(/^D(\d)(\d)$/, "D-$1-$2").replace(/^D(\d)$/, "D-$1");
  return `${m[1]} (${code})`;
}

const COURSE_COLOR: Record<string, string> = {
  "학위과정(D-2)": "#0f766e",
  "어학연수(D-4)": "#b45309"
};


export const metadata = pageMetadata("/universities");

export default function UniversitiesPage() {
  const series = [...foreignStudentByYear];
  const summary = foreignStudentSummary;
  const freshDate = realDataSummary.generatedAt.slice(0, 10);
  // 최신 시점 라벨: 월별 스톡이면 'YYYY.MM', 아니면 'YYYY'.
  const asOf = "asOfMonth" in summary && summary.asOfMonth ? `${summary.latestYear}.${summary.asOfMonth}` : `${summary.latestYear}`;

  // 추이 시각화 스케일 + 정점 연도
  const maxTotal = series.reduce((m, r) => Math.max(m, r.total), 1);
  const peak = series.reduce((p, r) => (r.total > p.total ? r : p), series[0] ?? { year: 0, total: 0 });

  // 유학생 국적 실데이터(KOSIS 법무부 DT_1B040A14): top 막대용으로 상위 12개국 가공.
  const studentNationality = realForeignStudentNationality.byNationality ?? [];
  const nationalityBars = studentNationality
    .slice(0, 12)
    .map((n) => ({ label: n.nationality, value: n.value }));
  const nationalityTotal = studentNationality.reduce((s, n) => s + n.value, 0);
  const topStudentNationality = studentNationality[0];

  // 학위과정별 분포(유학 D-2·석사·박사·어학연수 등): 도넛 + 범례용.
  // 주의: byDegree에는 상위 롤업(예: "유학(D-2)", "일반연수(D-4)")과 그 하위 세부코드(D-2-2 등)가
  // 함께 들어와 단순 합산 시 이중계산(약 2배)된다. 하위 코드를 가진 상위 코드는 제외해 상호배타 잎(leaf)만 사용.
  const degreeDistRaw = realForeignStudentNationality.byDegree ?? [];
  const degreeCode = (label: string) => label.match(/\(([^)]+)\)/)?.[1] ?? label;
  const allDegreeCodes = degreeDistRaw.map((d) => degreeCode(d.degree));
  const degreeDist = degreeDistRaw.filter((d) => {
    const code = degreeCode(d.degree);
    return !allDegreeCodes.some((c) => c !== code && c.startsWith(code + "-"));
  });
  const degreeTotal = degreeDist.reduce((s, d) => s + d.value, 0);

  // KEDI 시도별 외국인 유학생: 막대용(상위→하위 정렬은 원자료 순서 유지).
  const kediRegion = realKediStudentRegion.byRegion ?? [];
  const kediBars = kediRegion.map((r) => ({ label: r.region, value: r.value }));
  const kediTotal = kediRegion.reduce((s, r) => s + r.value, 0);
  const kediTopRegion = kediRegion[0];

  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="대학/유학생 분석"
        title="외국인 유학생 금융 수요 분석"
        description="법무부 연도별 외국인 유학생 체류현황(학위과정 D-2 · 어학연수 D-4)을 기반으로 유학생 규모 추이와 체류자격 구성을 분석해 신학기 계좌·체크카드·해외송금 캠페인 시점을 찾습니다."
      />

      {/* 데이터 신선도 배너 */}
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg px-4 py-2.5 text-xs"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#22c55e" }} />
        <span>
          출처: <strong>법무부 출입국·외국인정책본부</strong> · 수집 기준일 <strong>{freshDate}</strong> ·
          {series.length > 0 ? ` ${series[0].year}~${asOf} 시계열` : " 데이터 준비 중"} ·
          매일 01:00 KST 자동 갱신
        </span>
      </div>

      {hasRealStudentData ? (
        <>
          {/* KPI 카드 (실데이터) */}
          <section className="metric-grid">
            {[
              { label: `외국인 유학생 (${asOf})`, value: summary.total, icon: Users, bg: "#0f766e", sub: "법무부 체류현황(월별 스톡)" },
              { label: "학위과정 (D-2)", value: summary.degree, icon: GraduationCap, bg: "#3157a4", sub: "학위·연구 과정" },
              { label: "어학연수 (D-4)", value: summary.language, icon: Languages, bg: "#b45309", sub: "한국어·외국어 연수" },
              { label: `정점 (${peak.year})`, value: peak.total, icon: TrendingUp, bg: "#be123c", sub: "역대 최다 연도" }
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="surface flex flex-col gap-3 p-5" style={{ borderLeft: `4px solid ${k.bg}` }}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-muted">{k.label}</span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: k.bg }}>
                      <Icon aria-hidden size={18} />
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-[2.1rem] font-black leading-none text-ink">{formatNumber(k.value)}</span>
                    <span className="mb-0.5 text-sm text-muted">명</span>
                  </div>
                  <span className="text-[11px] text-muted">{k.sub}</span>
                </div>
              );
            })}
          </section>

          {/* 연도별 추이 (실데이터, 누적 막대) */}
          <section className="surface">
            <div className="surface-header pb-1">
              <div>
                <h3 className="surface-title">연도별 외국인 유학생 추이</h3>
                <p className="surface-subtitle">학위과정(D-2) + 어학연수(D-4) 누적 · 법무부 연도별 체류현황</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm" style={{ background: "#0f766e" }} />학위과정</span>
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm" style={{ background: "#b45309" }} />어학연수</span>
              </div>
            </div>
            <div className="flex items-end gap-2 overflow-x-auto px-5 pb-3 pt-6" style={{ height: 280 }}>
              {series.map((r) => {
                const h = Math.round((r.total / maxTotal) * 200);
                const degH = Math.round((r.degree / r.total) * h) || 0;
                const langH = h - degH;
                return (
                  <div key={r.year} className="flex min-w-[34px] flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-slate-500">{(r.total / 10000).toFixed(1)}만</span>
                    <div className="flex w-full max-w-[40px] flex-col justify-end rounded-t" style={{ height: 200 }}>
                      <div className="w-full" style={{ height: langH, background: "#b45309" }} />
                      <div className="w-full rounded-b" style={{ height: degH, background: "#0f766e" }} />
                    </div>
                    <span className="text-[10px] text-muted">{String(r.year).slice(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="px-5 pb-4 pt-1 text-xs text-muted" style={{ borderTop: "1px solid #eef2f7" }}>
              ⚠️ 최신 연도({summary.latestYear})는 법무부 원자료 기준 잠정치로, 집계 시점에 따라 전년 대비 낮게 보일 수 있습니다.
              추세 해석은 직전 완결 연도({peak.year} {formatNumber(peak.total)}명) 기준을 권장합니다.
            </div>
          </section>

          {/* 체류자격 구성 + 금융 시사점 */}
          <section className="two-column" style={{ gap: 20 }}>
            <div className="surface">
              <div className="surface-header pb-2">
                <div>
                  <h3 className="surface-title">체류자격별 구성 ({summary.latestYear})</h3>
                  <p className="surface-subtitle">유학생 세부 체류자격 분포</p>
                </div>
              </div>
              <div className="space-y-3 p-5 pt-2">
                {foreignStudentByVisa.map((v) => {
                  const max = foreignStudentByVisa[0]?.count || 1;
                  return (
                    <div key={v.visaRaw}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">{prettyVisa(v.visaRaw)}</span>
                        <span className="font-mono text-muted">{formatNumber(v.count)}명</span>
                      </div>
                      <div className="h-4 w-full overflow-hidden rounded" style={{ background: "#f1f5f9" }}>
                        <div className="h-4 rounded" style={{ width: `${Math.round((v.count / max) * 100)}%`, background: COURSE_COLOR[v.course] ?? "#64748b" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface p-5">
              <h3 className="surface-title mb-3">유학생 세그먼트 금융 시사점</h3>
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li><strong className="text-ink">학위과정(D-2)</strong> — 평균 체류 2~4년. 계좌·체크카드·등록금 납부·본국 송금 정기 수요. 신학기(3·9월) 캠페인 집중.</li>
                <li><strong className="text-ink">어학연수(D-4)</strong> — 단기 체류. 간편 계좌개설·환전·생활비 송금 중심. 어학원 밀집 지역 제휴 효과적.</li>
                <li><strong className="text-ink">규모 추이</strong> — {series[0]?.year}년 {formatNumber(series[0]?.total ?? 0)}명 → {peak.year}년 {formatNumber(peak.total)}명으로 장기 성장. 유학생 전용 다국어 모바일 뱅킹 수요 지속 확대.</li>
              </ul>
            </div>
          </section>

          {/* 대학별 랭킹 (대학알리미 수집 성공 시) */}
          {hasRealUniversityData ? (
            <section className="surface">
              <div className="surface-header pb-3">
                <div>
                  <h3 className="surface-title">대학별 외국인 유학생 TOP 30</h3>
                  <p className="surface-subtitle">
                    법무부 유학생관리정보(data.go.kr) 학교별 집계
                    {universitySummary.latestYear ? ` · ${universitySummary.latestYear}년` : ""} · 전체 {formatNumber(universitySummary.universityCount)}개교 집계
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-muted">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-muted">대학 (캠퍼스)</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-muted">외국인 유학생</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-muted">유학생 비중</th>
                    </tr>
                  </thead>
                  <tbody>
                    {universityRanking.map((u) => {
                      const max = universityRanking[0]?.foreignStudents || 1;
                      return (
                        <tr key={`${u.university}-${u.campus ?? u.sido ?? ""}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td className="px-4 py-2.5 font-bold text-muted">{u.rank}</td>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-ink">{u.university}</div>
                            {u.campus ? <div className="text-xs text-muted">{u.campus}</div> : null}
                            {u.sido && !u.campus ? <div className="text-xs text-muted">{u.sido}</div> : null}
                            <div className="mt-1 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full" style={{ background: "#eef2f7" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.round((u.foreignStudents / max) * 100)}%`, background: "#0f766e" }} />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-ink">{formatNumber(u.foreignStudents)}</td>
                          <td className="px-4 py-2.5 text-right text-muted">{u.foreignShare != null ? `${u.foreignShare}%` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <section className="surface p-5">
              <h3 className="surface-title mb-1">대학·캠퍼스별 세분화 (수집 대기)</h3>
              <p className="text-sm leading-6 text-muted">
                대학별·캠퍼스별 유학생 수는 <strong>법무부 유학생관리정보(data.go.kr 3069982)</strong> 소스가
                정상 수집되면 자동으로 TOP 30 랭킹이 표시됩니다. 파서는 연동 완료 상태이며, 공공데이터포털 응답이
                안정화되는 즉시 채워집니다.
              </p>
            </section>
          )}
        </>
      ) : (
        // 실데이터 미수집 시 폴백: 샘플 대학 랭킹
        <section className="surface mt-2">
          <div className="surface-header">
            <div>
              <h3 className="surface-title">유학생 금융 기회 대학 랭킹 (샘플)</h3>
              <p className="surface-subtitle">실데이터 수집 전 MVP 샘플입니다.</p>
            </div>
          </div>
          <div className="stack p-4">
            {sampleUniversityOpportunities.slice(0, 5).map((u) => (
              <article className="surface p-4" key={u.id}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-ink">{u.universityName} {u.campusName}</h3>
                  <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">{formatScore(u.opportunityScore)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{u.recommendedCampaign}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── 유학생 실데이터 차트 (KOSIS 법무부 DT_1B040A14 · KEDI) ─────────────── */}
      {(nationalityBars.length > 0 || degreeDist.length > 0 || kediBars.length > 0) ? (
        <div className="space-y-7">
          <div className="surface-header pb-0">
            <div>
              <h2 className="text-lg font-black text-ink">유학생 실데이터 심층 분석</h2>
              <p className="surface-subtitle">
                국적·학위과정·시도 단위 유학생 분포로 등록금 납부·생활비 송금·계좌개설 수요 시점을 정밀화합니다.
              </p>
            </div>
          </div>

          {/* (1) 국적별 유학생 TOP */}
          {nationalityBars.length > 0 ? (
            <Panel
              title={`국적별 유학생 TOP 12 (${realForeignStudentNationality.latestYear})`}
              subtitle="유학(D-2)·연수(D-4) 합산 · 본국 송금 채널과 다국어 응대 우선순위의 직접 근거"
              right={<span className="eyebrow">실데이터 · 단위 명</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box" style={{ height: 420 }}>
                <StudentHorizontalBarChart
                  data={nationalityBars}
                  labelKey="유학생"
                  fill="#0f766e"
                  unit="명"
                  seriesName="유학생"
                />
              </div>
              <div className="border-t border-line px-5 py-4 text-xs leading-6 text-muted">
                {topStudentNationality ? (
                  <>
                    <strong className="text-ink">{topStudentNationality.nationality}</strong>{" "}
                    {formatNumber(topStudentNationality.value)}명으로 1위
                    {nationalityTotal > 0
                      ? ` · 상위 12개국이 집계 유학생의 ${Math.round((nationalityBars.reduce((s, n) => s + n.value, 0) / nationalityTotal) * 100)}%`
                      : ""}
                    . <span className="text-ink">금융 수요</span> — 베트남·중국·몽골 등 상위 국적은 본국 송금 회랑(생활비·등록금 환급)
                    수요가 집중되므로 해당 통화 송금 우대·다국어 모바일 뱅킹 온보딩을 우선 배치하는 것이 효과적입니다.
                  </>
                ) : (
                  "유학생 국적 데이터를 준비 중입니다."
                )}
              </div>
            </Panel>
          ) : null}

          {/* (2) 학위과정별 분포 도넛 + 범례 */}
          {degreeDist.length > 0 ? (
            <div className="two-column" style={{ gap: 20 }}>
              <Panel
                title={`학위과정별 유학생 분포 (${realForeignStudentNationality.latestYear})`}
                subtitle="유학(D-2)·석사·박사·어학연수(D-4) 등 세부 과정 구성"
                right={<span className="eyebrow">실데이터 · 단위 명</span>}
                bodyClassName="p-0"
              >
                <div className="chart-box">
                  <StudentDegreeDonutChart data={[...degreeDist]} colors={DEGREE_COLORS} />
                </div>
                <div className="border-t border-line px-5 py-4">
                  <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                    {degreeDist.map((seg, index) => (
                      <li className="flex items-center justify-between gap-2" key={seg.degree}>
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: DEGREE_COLORS[index % DEGREE_COLORS.length] }}
                          />
                          <span className="truncate text-ink">{seg.degree}</span>
                        </span>
                        <span className="shrink-0 font-mono font-semibold text-muted">
                          {formatNumber(seg.value)}명
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Panel>

              <Panel
                title="학위과정별 금융 수요 해석"
                subtitle="과정별 체류기간·소득구조에 따른 금융 상품 매칭"
              >
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  <li>
                    <strong className="text-ink">유학(D-2)·학사/석사/박사</strong> — 장기 체류(2~5년). 매학기{" "}
                    <strong>등록금 납부</strong> 자동이체·등록금 대출/분납, 정기 <strong>생활비 송금</strong> 수신,
                    학위과정 계좌·체크카드의 핵심 고객군.
                  </li>
                  <li>
                    <strong className="text-ink">어학연수(D-4·D-4-1)</strong> — 단기 체류. 간편{" "}
                    <strong>계좌개설</strong>·환전·소액 생활비 송금 중심. 어학원 밀집 캠퍼스 제휴 온보딩이 효과적.
                  </li>
                  <li>
                    <strong className="text-ink">박사·연구유학(D-2-4·D-2-5)</strong> — 연구비·인건비 수령 계좌,
                    가족 동반 시 송금·예적금 수요까지 확장.
                  </li>
                  {degreeTotal > 0 ? (
                    <li className="text-xs text-muted">
                      집계 합계 {formatNumber(degreeTotal)}명 · 출처 KOSIS(법무부 DT_1B040A14).
                    </li>
                  ) : null}
                </ul>
              </Panel>
            </div>
          ) : null}

          {/* (3) KEDI 시도별 외국인 유학생 */}
          {kediBars.length > 0 ? (
            <Panel
              title={`시도별 외국인 유학생 (${realKediStudentRegion.latestYear})`}
              subtitle="KEDI 고등교육기관 외국인유학생 · 지역 영업망·캠퍼스 제휴 우선순위 근거"
              right={<span className="eyebrow">실데이터 · 단위 명</span>}
              bodyClassName="p-0"
            >
              <div className="chart-box" style={{ height: 520 }}>
                <StudentHorizontalBarChart
                  data={kediBars}
                  labelKey="유학생"
                  fill="#3157a4"
                  unit="명"
                  seriesName="유학생"
                />
              </div>
              <div className="border-t border-line px-5 py-4 text-xs leading-6 text-muted">
                {kediTopRegion ? (
                  <>
                    <strong className="text-ink">{kediTopRegion.region}</strong>{" "}
                    {formatNumber(kediTopRegion.value)}명으로 최다
                    {kediTotal > 0
                      ? ` · 전국 ${formatNumber(kediTotal)}명 중 ${Math.round((kediTopRegion.value / kediTotal) * 100)}% 집중`
                      : ""}
                    . <span className="text-ink">금융 수요</span> — 유학생 밀집 시도(수도권·경북·부산)의 캠퍼스
                    인근 지점·ATM·계좌개설 부스 배치와 신학기(3·9월) 송금/체크카드 캠페인 타깃 지역 선정에 활용합니다.
                  </>
                ) : (
                  "시도별 유학생 데이터를 준비 중입니다."
                )}
              </div>
            </Panel>
          ) : null}

          {/* 출처 표기 */}
          <p className="text-[11px] leading-5 text-muted">
            출처: KOSIS 국가통계포털 · 법무부 「체류외국인 국적·성별·학위과정별 현황」(DT_1B040A14) 및
            한국교육개발원(KEDI) 「고등교육기관 외국인유학생 현황」 ·
            기준연도 국적/학위 {realForeignStudentNationality.latestYear} · 시도 {realKediStudentRegion.latestYear}.
            집계 통계(개인 식별정보 미포함)이며 최신 연도는 잠정치일 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
