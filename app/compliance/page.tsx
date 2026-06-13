import { FileText, LockKeyhole, ShieldCheck } from "lucide-react";

const principles = [
  {
    title: "개인정보 처리 원칙",
    icon: ShieldCheck,
    body: "본 대시보드는 개인 단위 외국인 정보를 수집·저장·표시하지 않습니다. 모든 분석은 공공통계 또는 집계 단위 데이터만 사용합니다. 외국인등록번호, 여권번호, 국내거소신고번호, 이름, 전화번호, 상세주소, 계좌번호는 사용하지 않습니다."
  },
  {
    title: "재식별 방지",
    icon: LockKeyhole,
    body: "국적, 학교, 체류지역, 금융정보를 지나치게 세분화하면 개인 재식별 위험이 있습니다. 따라서 소수 셀은 마스킹하거나 상위 지역·상위 분류로 병합합니다."
  },
  {
    title: "내부 금융 데이터 결합 원칙",
    icon: FileText,
    body: "내부 금융 데이터는 개인 단위가 아닌 지역·월·국적·세그먼트 단위 집계값만 사용합니다. 개인 단위 분석이 필요한 경우에는 데이터전문기관을 통한 가명정보 결합 절차를 별도로 검토해야 합니다."
  }
];

export default function CompliancePage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">개인정보/컴플라이언스</p>
        <h2 className="page-title">집계 분석 원칙과 재식별 방지</h2>
        <p className="page-description">
          이 프로젝트의 목적은 개인 추적이 아니라, 합법적이고 안전한 방식으로 지역·국적·체류자격·대학
          단위 시장 기회를 이해하는 것입니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {principles.map((principle) => {
          const Icon = principle.icon;
          return (
            <article className="surface p-5" key={principle.title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                <Icon aria-hidden size={22} />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{principle.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">{principle.body}</p>
            </article>
          );
        })}
      </section>

      <section className="surface mt-4 p-5">
        <h3 className="text-base font-bold text-ink">소수 셀 처리 기준</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100">
{`if count < 5:
  display = "비공개"`}
          </pre>
          <pre className="overflow-x-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100">
{`if count < 10:
  merge_to_parent_region()`}
          </pre>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          실제 운영에서는 금융기관 내부 규정, 개인정보보호법, 신용정보법, 데이터 결합 심사
          기준에 맞춰 임계값과 병합 정책을 조정해야 합니다.
        </p>
      </section>
    </>
  );
}
