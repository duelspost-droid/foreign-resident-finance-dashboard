import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "외국인 금융 인사이트",
  description:
    "집계 단위 외국인 통계와 금융 집계 데이터를 기반으로 시장 기회를 분석하는 B2B 대시보드"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="main-shell">
            <Header />
            <div className="content-shell">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
