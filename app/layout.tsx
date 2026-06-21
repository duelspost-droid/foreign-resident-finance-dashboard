import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { FilterBar } from "@/components/layout/FilterBar";
import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { MobileNavProvider } from "@/components/layout/MobileNavContext";
import { sidoForeignerStats } from "@/lib/data/regionAggregates";
import {
  realNationalityDistribution,
  realForeignResidentStatus,
} from "@/lib/data/generated/realData";
import "./globals.css";

export const metadata: Metadata = {
  title: "외국인 금융 인사이트",
  description:
    "집계 단위 외국인 통계와 금융 집계 데이터를 기반으로 시장 기회를 분석하는 B2B 대시보드"
};

// 필터 옵션은 서버에서 실데이터로 계산해 Client Component에 직렬화 가능한 props로 전달.
const sidoOptions = ["전체", ...Object.keys(sidoForeignerStats)];
const nationalityOptions = [
  "전체",
  ...realNationalityDistribution.slice(0, 15).map((r) => r.nationality),
];
const segmentOptions = [
  "전체",
  ...[...new Set(realForeignResidentStatus.map((r) => r.segmentType))],
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AnalyticsBeacon />
        <MobileNavProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="main-shell">
              <Header />
              <Suspense>
                <FilterBar
                  sidoOptions={sidoOptions}
                  nationalityOptions={nationalityOptions}
                  segmentOptions={segmentOptions}
                />
              </Suspense>
              <div className="content-shell">{children}</div>
            </main>
          </div>
        </MobileNavProvider>
      </body>
    </html>
  );
}
