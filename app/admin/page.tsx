import { SourceApprovalQueue } from "@/components/admin/SourceApprovalQueue";

export default function AdminPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">시스템 · 데이터 에이전트</p>
        <h2 className="page-title">데이터 발굴 승인</h2>
        <p className="page-description">
          데이터 에이전트가 자동 발굴한 신규 데이터셋 후보를 검토하고 승인/거부합니다. 승인된 후보는 다음
          수집 배치에서 자동으로 등록·수집됩니다.
        </p>
      </section>

      <SourceApprovalQueue />
    </>
  );
}
