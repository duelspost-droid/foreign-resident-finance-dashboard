import { GraduationCap, Languages, TrendingUp, Users } from "lucide-react";
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
import { realDataSummary } from "@/lib/data/generated/realData";
import { formatNumber, formatScore } from "@/lib/utils/format";

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

export default function UniversitiesPage() {
  const series = [...foreignStudentByYear];
  const summary = foreignStudentSummary;
  const freshDate = realDataSummary.generatedAt.slice(0, 10);

  // 추이 시각화 스케일 + 정점 연도
  const maxTotal = series.reduce((m, r) => Math.max(m, r.total), 1);
  const peak = series.reduce((p, r) => (r.total > p.total ? r : p), series[0] ?? { year: 0, total: 0 });

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
          {series.length > 0 ? ` ${series[0].year}~${summary.latestYear} 시계열` : " 데이터 준비 중"} ·
          매일 18:30 UTC 자동 갱신
        </span>
      </div>

      {hasRealStudentData ? (
        <>
          {/* KPI 카드 (실데이터) */}
          <section className="metric-grid">
            {[
              { label: `외국인 유학생 (${summary.latestYear})`, value: summary.total, icon: Users, bg: "#0f766e", sub: "법무부 체류현황" },
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
                    대학알리미 고등교육기관 외국인유학생수
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
                대학별·캠퍼스별 유학생 수는 <strong>대학알리미(고등교육기관 외국인유학생 수)</strong> 소스가
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
    </div>
  );
}
