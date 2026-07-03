import type { Metadata } from "next";

// 외국인 정보 관리(가상)는 합성 데이터 데모 화면이라 검색 색인 대상에서 제외한다.
export const metadata: Metadata = {
  title: "외국인 정보 관리 (가상)",
  robots: { index: false, follow: false }
};

export default function MockResidentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
