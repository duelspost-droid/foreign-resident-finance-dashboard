import { SourceApprovalQueue } from "@/components/admin/SourceApprovalQueue";
import { WebDiscoverySection } from "@/components/data/WebDiscoverySection";

export default function AdminPage() {
  return (
    <>
      <section className="page-header">
        <p className="page-kicker">시스템 · 데이터 에이전트</p>
        <h2 className="page-title">데이터 에이전트 승인</h2>
        <p className="page-description">
          데이터 에이전트가 자동 발굴한 신규 데이터셋 후보를 검토하고 승인/거부합니다. 승인된 후보는 다음
          수집 배치에서 자동으로 등록·수집됩니다. AI 웹 발굴 리드 중 자동수집 가능(data.go.kr)한 항목은
          아래 승인 큐에 후보로 올라오고, 그 외(국제기구·대시보드 등)는 ‘AI 웹 발굴 리드’에서 수동 검토합니다.
        </p>
      </section>

      <SourceApprovalQueue />

      {/* AI 웹 발굴 리드 — 전 인터넷 발굴 결과(검토). 자동수집 가능분은 위 승인 큐에 적재됨. */}
      <WebDiscoverySection />
    </>
  );
}
