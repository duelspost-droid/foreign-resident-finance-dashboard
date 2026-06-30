import { pageMetadata } from "@/lib/seo";
import {
  Ban,
  CheckCircle2,
  EyeOff,
  FileText,
  Layers,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { Panel } from "@/components/ui/Panel";
import { StatTile } from "@/components/ui/StatTile";

// 사용이 금지된 개인 식별자(본문 텍스트에서 그대로 추출).
const prohibitedIdentifiers = [
  "외국인등록번호",
  "여권번호",
  "국내거소신고번호",
  "이름",
  "전화번호",
  "상세주소",
  "계좌번호"
];

// 집계 분석 3대 원칙 — 본문은 기존 텍스트 그대로 유지.
const principles = [
  {
    title: "개인정보 처리 원칙",
    icon: ShieldCheck,
    accent: "#0f766e",
    body: "본 대시보드는 개인 단위 외국인 정보를 수집·저장·표시하지 않습니다. 모든 분석은 공공통계 또는 집계 단위 데이터만 사용합니다. 외국인등록번호, 여권번호, 국내거소신고번호, 이름, 전화번호, 상세주소, 계좌번호는 사용하지 않습니다."
  },
  {
    title: "재식별 방지",
    icon: LockKeyhole,
    accent: "#3157a4",
    body: "국적, 학교, 체류지역, 금융정보를 지나치게 세분화하면 개인 재식별 위험이 있습니다. 따라서 소수 셀은 마스킹하거나 상위 지역·상위 분류로 병합합니다."
  },
  {
    title: "내부 금융 데이터 결합 원칙",
    icon: FileText,
    accent: "#b45309",
    body: "내부 금융 데이터는 개인 단위가 아닌 지역·월·국적·세그먼트 단위 집계값만 사용합니다. 개인 단위 분석이 필요한 경우에는 데이터전문기관을 통한 가명정보 결합 절차를 별도로 검토해야 합니다."
  }
];


export const metadata = pageMetadata("/compliance");

export default function CompliancePage() {
  return (
    <div className="space-y-7 pb-14">
      <PageHero
        kicker="개인정보/컴플라이언스"
        title="집계 분석 원칙과 재식별 방지"
        description="이 프로젝트의 목적은 개인 추적이 아니라, 합법적이고 안전한 방식으로 지역·국적·체류자격·대학 단위 시장 기회를 이해하는 것입니다."
      />

      {/* 원칙 요약 KPI */}
      <div className="stat-grid">
        <StatTile
          label="사용 금지 식별자"
          value={prohibitedIdentifiers.length}
          unit="종"
          icon={<Ban size={18} />}
          accent="#be123c"
          trend={{ label: "사용 안 함", dir: "down" }}
          sub="개인 식별자 전면 배제"
        />
        <StatTile
          label="분석 데이터 단위"
          value="집계"
          icon={<Layers size={18} />}
          accent="#0f766e"
          trend={{ label: "공공통계·집계값", dir: "up" }}
          sub="개인 단위 미수집"
        />
        <StatTile
          label="소수 셀 처리"
          value="마스킹"
          icon={<EyeOff size={18} />}
          accent="#3157a4"
          trend={{ label: "병합·비공개", dir: "neutral" }}
          sub="count < 5 비공개"
        />
        <StatTile
          label="집계 원칙"
          value={principles.length}
          unit="대"
          icon={<CheckCircle2 size={18} />}
          accent="#b45309"
          trend={{ label: "처리·방지·결합", dir: "up" }}
          sub="전 페이지 공통 적용"
        />
      </div>

      {/* 금지 항목 시각 스트립 */}
      <Panel
        title="사용 금지 개인 식별자"
        subtitle="아래 항목은 어떤 형태로도 수집·저장·표시하지 않습니다."
        right={
          <span className="chip chip-down">
            <Ban size={13} aria-hidden /> 전면 금지
          </span>
        }
      >
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
          <div className="flex flex-wrap gap-2">
            {prohibitedIdentifiers.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-rose-700 shadow-sm"
              >
                <Ban size={14} aria-hidden className="text-rose-600" />
                {id}
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-rose-700">
            <LockKeyhole size={13} aria-hidden />
            개인 단위 외국인 데이터 결합 금지 — 집계 단위 통계만 사용합니다.
          </p>
        </div>
      </Panel>

      {/* 3대 원칙 카드 */}
      <section className="grid gap-4 md:grid-cols-3">
        {principles.map((principle) => {
          const Icon = principle.icon;
          return (
            <article className="surface surface-hover p-5" key={principle.title}>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: principle.accent }}
              >
                <Icon aria-hidden size={22} />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{principle.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{principle.body}</p>
            </article>
          );
        })}
      </section>

      {/* 소수 셀 처리 기준 */}
      <Panel
        title="소수 셀 처리 기준"
        subtitle="재식별 위험을 낮추기 위한 소수 셀 마스킹."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-down">현재 적용: count 1~4 → “&lt;5”</span>
            <span className="chip chip-neutral">예시 정책: 상위 지역 병합</span>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-semibold text-rose-300">
              <EyeOff size={13} aria-hidden /> 소수 셀 마스킹 <span className="ml-auto rounded bg-teal-900/60 px-1.5 py-0.5 text-[10px] text-teal-300">적용 중</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-slate-100">
{`if 1 <= count <= 4:
  display = "<5"`}
            </pre>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 text-xs font-semibold text-sky-300">
              <Layers size={13} aria-hidden /> 상위 지역 병합 <span className="ml-auto rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">예시(미적용)</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-slate-100">
{`if count < 10:
  merge_to_parent_region()`}
            </pre>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          현재 구현은 <strong>범용 원본 뷰어</strong>에서 1~4명 소수 셀을 “&lt;5”로 마스킹합니다(정부 공표 집계는 이미 소수 셀이 없어 미적용).
          상위 지역 병합은 예시 정책이며, 실제 운영에서는 금융기관 내부 규정·개인정보보호법·신용정보법·데이터 결합 심사 기준에 맞춰 임계값과 병합 정책을 도입·조정해야 합니다.
        </p>
      </Panel>
    </div>
  );
}
