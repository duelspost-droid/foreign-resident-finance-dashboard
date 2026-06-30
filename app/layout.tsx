import type { Metadata } from "next";
import { realDataSummary } from "@/lib/data/generated/realData";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AnalyticsBeacon } from "@/components/analytics/AnalyticsBeacon";
import { MobileNavProvider } from "@/components/layout/MobileNavContext";
import { SITE } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — 국내 거주 외국인 금융 시장 분석`,
    template: `%s · ${SITE.name}`
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    url: "/",
    title: `${SITE.name} — 국내 거주 외국인 금융 시장 분석`,
    description: SITE.description
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AnalyticsBeacon />
        <MobileNavProvider>
          <div className="app-shell">
            <Sidebar />
            <main className="main-shell">
              <Header generatedAt={realDataSummary.generatedAt} />
              <div className="content-shell">{children}</div>
            </main>
          </div>
        </MobileNavProvider>
      </body>
    </html>
  );
}
